import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const searchPage = path.join(repoRoot, 'buscar', 'index.html');

const FORBIDDEN_RUNTIME_PATTERNS = Object.freeze([
  /\bfetch\b/,
  /\bXMLHttpRequest\b/,
  /\bnavigator\.sendBeacon\b/,
  /\bWebSocket\b/,
  /\bEventSource\b/,
  /\bWebTransport\b/,
  /\bimportScripts\s*\(/,
  /\b(?:new\s+)?(?:Worker|SharedWorker)\s*\(/,
  /\bnavigator\.serviceWorker\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bindexedDB\b/,
  /\bdocument\.cookie\b/,
  /\bcaches\b/,
  /\bnavigator\.storage\b/,
  /\bURLSearchParams\b/,
  /\blocation\.(?:search|hash)\b/,
  /\bhistory\.(?:pushState|replaceState)\s*\(/,
  /\blocation\.(?:assign|replace)\s*\(/,
  /\bwindow\.open\s*\(/,
  /\bnew\s+Image\s*\(/,
  /\bimport\s*\(/,
  /(?:window|globalThis|self)\s*\[\s*['"](?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|WebTransport|localStorage|sessionStorage|indexedDB|caches)['"]\s*\]/,
  /\bnavigator\s*\[\s*['"]sendBeacon['"]\s*\]/,
  /(?:window|globalThis|self)\.location\s*\[\s*['"](?:search|hash)['"]\s*\]/,
  /(?:window|globalThis|self)\s*\[\s*['"]location['"]\s*\]\s*\[\s*['"](?:search|hash)['"]\s*\]/,
  /\bvisitor-analytics\b/,
  /\bpublic-page-runtime\b/
]);

function importSpecifiers(source) {
  const imports = [];
  const patterns = [
    /\bimport\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bexport\s+(?:\*|\{[^}]*\})\s+from\s+['"]([^'"]+)['"]/g
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) imports.push(match[1]);
  }
  return imports;
}

async function collectDependencyClosure(entryFile, root = repoRoot) {
  const rootPath = await realpath(path.resolve(root));
  const pending = [await realpath(path.resolve(entryFile))];
  const visited = new Map();

  while (pending.length) {
    const current = pending.pop();
    if (visited.has(current)) continue;
    assert.ok(current === rootPath || current.startsWith(`${rootPath}${path.sep}`), `Import escapes audited root: ${current}`);

    const source = await readFile(current, 'utf8');
    visited.set(current, source);

    for (const specifier of importSpecifiers(source)) {
      assert.ok(specifier.startsWith('.'), `Browser search must not use a bare or remote import: ${specifier}`);
      assert.doesNotMatch(specifier, /[?#]/, `Audited imports must not hide a query or fragment: ${specifier}`);
      const candidate = path.resolve(path.dirname(current), specifier);
      assert.match(path.extname(candidate), /^\.m?js$/, `Audited dependency must be JavaScript: ${specifier}`);
      const resolved = await realpath(candidate);
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

  for (const expected of [
    'buscar/index.html',
    'src/search-clarification.js',
    'src/search-crisis-router.js',
    'src/suicide-context-classifier.js'
  ]) assert.ok(relativeFiles.includes(expected), `Missing audited dependency: ${expected}`);
  assert.deepEqual(privacyViolations(closure), []);
});

test('search page cannot submit query text through a form action', async () => {
  const source = await readFile(searchPage, 'utf8');
  assert.doesNotMatch(source, /<form[^>]+action\s*=/i);
  assert.doesNotMatch(source, /<input[^>]+name\s*=|<textarea[^>]+name\s*=/i);
  assert.doesNotMatch(source, /<script[^>]+src\s*=/i);
  assert.doesNotMatch(source, /\son[a-z]+\s*=/i);
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

test('dependency closure gate follows re-exports and rejects dynamic imports', async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'search-privacy-reexport-'));
  const entry = path.join(fixture, 'entry.js');
  const middle = path.join(fixture, 'middle.js');
  const child = path.join(fixture, 'child.js');
  await writeFile(entry, "export * from './middle.js';\n", 'utf8');
  await writeFile(middle, "export { child } from './child.js';\n", 'utf8');
  await writeFile(child, "export const child = () => import('./remote-feature.js');\n", 'utf8');

  const closure = await collectDependencyClosure(entry, fixture);
  assert.ok([...closure.keys()].some((filename) => filename.endsWith('child.js')));
  assert.ok(privacyViolations(closure).some((violation) => violation.includes('import')));
});

test('dependency closure gate detects common computed access to network APIs', async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'search-privacy-computed-'));
  const entry = path.join(fixture, 'entry.js');
  await writeFile(entry, "export const send = (value) => window['fetch']('/collect', { body: value });\n", 'utf8');

  const closure = await collectDependencyClosure(entry, fixture);
  assert.ok(privacyViolations(closure).some((violation) => violation.includes('window')));
});

test('dependency closure gate detects aliased and computed privacy sinks', async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'search-privacy-alias-'));
  const entry = path.join(fixture, 'entry.js');
  await writeFile(entry, [
    "const send = window.fetch.bind(window);",
    "const beacon = navigator['sendBeacon'];",
    "const query = globalThis.location['search'];",
    'export { send, beacon, query };'
  ].join('\n'), 'utf8');

  const closure = await collectDependencyClosure(entry, fixture);
  const violations = privacyViolations(closure);
  assert.ok(violations.some((violation) => violation.includes('fetch')));
  assert.ok(violations.some((violation) => violation.includes('sendBeacon')));
  assert.ok(violations.some((violation) => violation.includes('location')));
});
