import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const searchPage = path.join(repoRoot, 'buscar', 'index.html');

const FORBIDDEN_RUNTIME_PATTERNS = Object.freeze([
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bnavigator\.sendBeacon\b/,
  /\bWebSocket\b/,
  /\bEventSource\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bindexedDB\b/,
  /\bdocument\.cookie\b/,
  /\bURLSearchParams\b/,
  /\blocation\.(?:search|hash)\b/,
  /\bvisitor-analytics\b/,
  /\bpublic-page-runtime\b/
]);

function importSpecifiers(source) {
  const imports = [];
  const pattern = /\bimport\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(pattern)) imports.push(match[1]);
  return imports;
}

async function collectDependencyClosure(entryFile, root = repoRoot) {
  const rootPath = path.resolve(root);
  const pending = [path.resolve(entryFile)];
  const visited = new Map();

  while (pending.length) {
    const current = pending.pop();
    if (visited.has(current)) continue;
    assert.ok(current === rootPath || current.startsWith(`${rootPath}${path.sep}`), `Import escapes audited root: ${current}`);

    const source = await readFile(current, 'utf8');
    visited.set(current, source);

    for (const specifier of importSpecifiers(source)) {
      assert.ok(specifier.startsWith('.'), `Browser search must not use a bare or remote import: ${specifier}`);
      const resolved = path.resolve(path.dirname(current), specifier);
      assert.ok(resolved === rootPath || resolved.startsWith(`${rootPath}${path.sep}`), `Import escapes audited root: ${specifier}`);
      pending.push(resolved);
    }
  }

  return visited;
}

function privacyViolations(closure) {
  const violations = [];
  for (const [filename, source] of closure) {
    for (const pattern of FORBIDDEN_RUNTIME_PATTERNS) {
      if (pattern.test(source)) violations.push(`${path.basename(filename)}: ${pattern}`);
    }
  }
  return violations;
}

test('search privacy gate audits the complete current module dependency closure', async () => {
  const closure = await collectDependencyClosure(searchPage);
  const relativeFiles = [...closure.keys()].map((filename) => path.relative(repoRoot, filename)).sort();

  assert.deepEqual(relativeFiles, [
    'buscar/index.html',
    'src/search-clarification.js',
    'src/search-crisis-router.js',
    'src/suicide-context-classifier.js'
  ]);
  assert.deepEqual(privacyViolations(closure), []);
});

test('search page cannot submit query text through a form action', async () => {
  const source = await readFile(searchPage, 'utf8');
  assert.doesNotMatch(source, /<form[^>]+action\s*=/i);
  assert.doesNotMatch(source, /<input[^>]+name\s*=|<textarea[^>]+name\s*=/i);
});

test('dependency closure gate detects a network call introduced in a transitive module', async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'search-privacy-closure-'));
  const entry = path.join(fixture, 'entry.js');
  const child = path.join(fixture, 'child.js');
  await writeFile(entry, "import './child.js';\n", 'utf8');
  await writeFile(child, "export function leak(query) { return fetch('/collect', { body: query }); }\n", 'utf8');

  const closure = await collectDependencyClosure(entry, fixture);
  assert.ok(privacyViolations(closure).some((violation) => violation.includes('fetch')));
});
