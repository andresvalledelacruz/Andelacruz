#!/usr/bin/env node

import { readFile, realpath, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANALYTICS_FILE = 'visitor-analytics.js';
const SAFE_PAYLOAD_KEYS = ['p_country_code', 'p_device_class', 'p_path', 'p_referrer_host'];
const APPROVED_ANALYTICS_ORIGIN = 'https://enspficpubtttybpzhph.supabase.co';
const APPROVED_HOME_EXTERNAL_MODULE = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const PINNED_MEASUREMENT_FILES = new Map([
  ['app.js', 'bd6ac96b527792e487aad882f4d8659bb5e869c41baeb2e7fb4c965fa42ef920'],
  ['public-page-runtime.js', 'a0654d52caf4b7fbb5c191a609a6336c8d25ff8814aadd7142afc811ca405845'],
  ['visitor-analytics.js', '3ca9ed490f749aea8f9728e0f762a26c42f4d390658954fbb13dd98b1cc99031'],
  ['supabase/migrations/20260830002000_add_privacy_safe_pageview_analytics.sql', '384c3210cd9e38c9922efda675eb9eae1e0104e0dc77103075c0cb08e61f5a9c'],
  ['buscar/index.html', '97fc7f3a439f6a6f9e7ce3339e0b45b6ba8eebdf821e9a6949b2a1356ef6f2f4'],
  ['app-core.js', 'db6908a65b1696a6926aa6271e8b9435cbe58f5f92d26746db6150cafbd95092'],
  ['next-step-adapter.js', '488372c8bde96402afe8bf87fae0a6ff368a06e9cab69c3090f7e03419436641'],
  ['next-step-guidance.js', 'ead14c25e029c01173f01f1cae6047e13644b329e073d6792da8f8e8c8268915'],
  ['resource-links.js', 'ddbdcd243c7981d73238463f5ad9849fbf99b8bc0f1a3164290c536aaea4c066'],
  ['search-home-entry.js', 'd4d9f174706b7b89da6861ce8c10b0b437d20d276c00c68266d80faee14418c5'],
  ['urgent-help-nav.js', '118be1f2b753ae750f9b51eff69dda6ea8834df2734d014dabd314b2e3f221b7'],
  ['src/search-clarification.js', '4044c9d91594583cb3ff78eb696c0eca73257dd558917ebf81ba5493f63ee55c'],
  ['src/search-content-catalog.js', '205f1af6a0698faf58dafb0509d2035df6839d7d1e0cc3d3cd153e2682c89fb2'],
  ['src/search-crisis-router.js', '8f278bfeff60ce090de277b393c2c1848a2cec71b734968ddb5d00b9044796c7'],
  ['src/suicide-context-classifier.js', '2cf96cb615bcce941ab1a8546a6a1ede8cd8d66698d194759696d2a84e880d17'],
]);
const APPROVED_HOME_CLOSURE = [
  'app-core.js', 'app.js', 'next-step-adapter.js', 'next-step-guidance.js',
  'resource-links.js', 'search-home-entry.js', 'urgent-help-nav.js', 'visitor-analytics.js',
];
const APPROVED_SEARCH_CLOSURE = [
  'src/search-clarification.js', 'src/search-content-catalog.js',
  'src/search-crisis-router.js', 'src/suicide-context-classifier.js',
];
const APPROVED_PROTECTED_INLINE = new Map([
  ['/ayuda-urgente.html', ['1c40cd4e59a05c9039247e0c0cfff6fe3017d8e8b1b8431be8d481a354b9e25c']],
]);
const MEASUREMENT_BASELINE = [
  'index.html',
  'como-revisamos.html',
  'dinero/index.html',
  'duelo/index.html',
  'familia/index.html',
  'familia/mi-familia-no-me-habla/index.html',
  'gestion-emocional/index.html',
  'privacidad.html',
  'rupturas/index.html',
  'sobre.html',
  'soledad/index.html',
  'trabajo-dinero/index.html',
  'trabajo/hago-entrevistas-pero-no-me-contratan/index.html',
  'trabajo/index.html',
  'trabajo/mi-curriculum-no-funciona/index.html',
  'trabajo/necesito-formacion-para-encontrar-trabajo/index.html',
  'trabajo/quiero-encontrar-trabajo-cuanto-antes/index.html',
];
const ANALYTICS_MARKERS = /(?:analytics|telemetry|tracking|gtag|googletagmanager|dataLayer|plausible|matomo|segment|mixpanel|hotjar|clarity|pixel)/i;
const PRIVACY_SINKS = [
  ['network request', /\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|WebTransport)\b/],
  ['persistent storage', /\b(?:localStorage|sessionStorage|indexedDB|cookieStore|document\s*\.\s*cookie|caches\s*\.)/],
  ['sensitive URL state', /(?:location|document)\s*\.\s*(?:search|hash|href|URL)\b|\bURLSearchParams\b|\bhistory\s*\./],
  ['referrer collection', /\bdocument\s*\.\s*referrer\b/],
  ['tracking marker', ANALYTICS_MARKERS],
  ['dynamic execution', /\b(?:eval|Function)\s*\(/],
  ['pixel or form exfiltration', /\bnew\s+Image\b|\.\s*submit\s*\(|\bformAction\b/],
];

function stripComments(source) {
  let output = '';
  let state = 'code';
  let quote = '';
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (state === 'line') {
      if (char === '\n') { state = 'code'; output += '\n'; }
      else output += ' ';
      continue;
    }
    if (state === 'block') {
      if (char === '*' && next === '/') { output += '  '; index += 1; state = 'code'; }
      else output += char === '\n' ? '\n' : ' ';
      continue;
    }
    if (state === 'string') {
      output += char;
      if (char === '\\') { output += next ?? ''; index += 1; continue; }
      if (char === quote) state = 'code';
      continue;
    }
    if (char === '/' && next === '/') { output += '  '; index += 1; state = 'line'; continue; }
    if (char === '/' && next === '*') { output += '  '; index += 1; state = 'block'; continue; }
    if (char === '"' || char === "'" || char === '`') { state = 'string'; quote = char; output += char; continue; }
    output += char;
  }
  if (state === 'block' || state === 'string') throw new Error(`unclosed ${state} in JavaScript`);
  return output;
}

function normalizeComputedProperties(source) {
  let normalized = source;
  let previous;
  do {
    previous = normalized;
    normalized = normalized
      .replace(/\[\s*(['"])([A-Za-z_$][\w$]*)\1\s*\]/g, '.$2')
      .replace(/(['"])([A-Za-z_$][\w$]*)\1\s*\+\s*(['"])([A-Za-z_$][\w$]*)\3/g, (_m, _q1, a, _q2, b) => `'${a}${b}'`);
  } while (normalized !== previous);
  return normalized;
}

function withoutStaticallyDeadBranches(source) {
  return source
    .replace(/\bif\s*\(\s*false\s*\)\s*\{[^{}]*\}/g, ' ')
    .replace(/\bif\s*\(\s*false\s*\)\s*[^;\n{}]+;/g, ' ')
    .replace(/\bfalse\s*&&\s*[^;\n]+;?/g, ' ');
}

function executableSource(source) {
  return normalizeComputedProperties(stripComments(source));
}

function parseAttributes(raw) {
  const attributes = new Map();
  for (const match of raw.matchAll(/([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
}

export function extractExecutableScripts(html, label = 'HTML') {
  const scripts = [];
  const openings = [...html.matchAll(/<script\b([^>]*)>/gi)];
  const closings = [...html.matchAll(/<\/script\s*>/gi)];
  if (openings.length !== closings.length) throw new Error(`${label}: unbalanced script tags`);
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attributes = parseAttributes(match[1]);
    const type = (attributes.get('type') || '').trim().toLowerCase();
    if (type === 'application/ld+json') continue;
    if (type && type !== 'module' && type !== 'text/javascript' && type !== 'application/javascript') {
      throw new Error(`${label}: unsupported executable script type ${type}`);
    }
    scripts.push({ src: attributes.get('src') || null, inline: match[2], type });
  }
  return scripts;
}

function localSpecifier(specifier) {
  return specifier.startsWith('/') || specifier.startsWith('./') || specifier.startsWith('../');
}

function scriptSpecifiers(source) {
  const code = withoutStaticallyDeadBranches(executableSource(source));
  const specs = new Set();
  for (const match of code.matchAll(/(?:\bimport\s*(?:[^'"()]*?\sfrom\s*)?|\bexport\s+[^'"()]*?\sfrom\s*|\bimport\s*\()(['"])([^'"]+)\1/g)) specs.add(match[2]);
  for (const match of code.matchAll(/(?:\.\s*src\s*=|setAttribute\s*\(\s*['"]src['"]\s*,|\b(?:load|importScripts|Worker|SharedWorker)\s*\()\s*(['"])([^'"]+\.js(?:[?#][^'"]*)?)\1/g)) specs.add(match[2]);
  if (/\bimport\s*\((?!\s*['"])/.test(code)) throw new Error('non-literal dynamic import');
  const unresolvedSetAttribute = [...code.matchAll(/setAttribute\s*\(\s*['"]src['"]\s*,\s*([^,)]+)/g)]
    .some((match) => !/^['"]/.test(match[1].trim()));
  const loaderCalls = [...code.matchAll(/\bload\s*\(\s*([^,)]+)/g)].map((match) => match[1].trim());
  const canonicalLiteralLoader = /(?:const|let|var)\s+load\s*=\s*\(\s*src\b/.test(code)
    && loaderCalls.length > 0
    && loaderCalls.every((argument) => /^['"]/.test(argument));
  const unresolvedSrcAssignment = [...code.matchAll(/\.\s*src\s*=\s*([^;\n]+)/g)]
    .some((match) => !/^['"]/.test(match[1].trim()) && !(match[1].trim() === 'src' && canonicalLiteralLoader));
  if (unresolvedSetAttribute || unresolvedSrcAssignment) {
    throw new Error('non-literal dynamic script source');
  }
  return [...specs];
}

async function resolveInsideRoot(rootReal, baseFile, specifier) {
  if (/^(?:https?:)?\/\//i.test(specifier) || /^(?:data|blob):/i.test(specifier)) throw new Error(`external script dependency: ${specifier}`);
  if (!localSpecifier(specifier)) throw new Error(`bare script dependency: ${specifier}`);
  if (/[?#]/.test(specifier)) throw new Error(`script dependency contains query or fragment: ${specifier}`);
  const candidate = specifier.startsWith('/')
    ? path.resolve(rootReal, `.${specifier}`)
    : path.resolve(path.dirname(baseFile), specifier);
  const resolved = await realpath(candidate);
  if (resolved !== rootReal && !resolved.startsWith(`${rootReal}${path.sep}`)) throw new Error(`script dependency escapes root: ${specifier}`);
  if (!resolved.endsWith('.js') && !resolved.endsWith('.mjs')) throw new Error(`non-JavaScript dependency: ${specifier}`);
  return resolved;
}

export async function buildLocalScriptClosure({ root = DEFAULT_ROOT, htmlFile, inlineSources = [], allowExternal = false }) {
  const rootReal = await realpath(root);
  const entry = await realpath(path.resolve(rootReal, htmlFile));
  if (entry !== rootReal && !entry.startsWith(`${rootReal}${path.sep}`)) throw new Error(`${htmlFile} escapes root`);
  const html = await readFile(entry, 'utf8');
  const scripts = extractExecutableScripts(html, htmlFile);
  const files = new Map();
  const queue = [];
  const inline = [...inlineSources];
  for (const script of scripts) {
    if (script.src) {
      const htmlSpecifier = /^(?:https?:)?\/\//i.test(script.src) || /^(?:data|blob):/i.test(script.src)
        ? script.src
        : localSpecifier(script.src) ? script.src : `./${script.src}`;
      queue.push(await resolveInsideRoot(rootReal, entry, htmlSpecifier));
    }
    else inline.push({ label: `${htmlFile}:inline`, source: script.inline, baseFile: entry });
  }
  for (const item of inline) {
    const source = typeof item === 'string' ? item : item.source;
    const baseFile = typeof item === 'string' ? entry : item.baseFile;
    for (const specifier of scriptSpecifiers(source)) {
      if (allowExternal && /^(?:https?:)?\/\//i.test(specifier)) continue;
      queue.push(await resolveInsideRoot(rootReal, baseFile, specifier));
    }
  }
  while (queue.length) {
    const file = queue.shift();
    if (files.has(file)) continue;
    const source = await readFile(file, 'utf8');
    files.set(file, source);
    for (const specifier of scriptSpecifiers(source)) {
      if (allowExternal && /^(?:https?:)?\/\//i.test(specifier)) continue;
      queue.push(await resolveInsideRoot(rootReal, file, specifier));
    }
  }
  return files;
}

function forbiddenSignals(source, label, { allowAnalytics = false } = {}) {
  const code = executableSource(source);
  const failures = [];
  for (const [name, pattern] of PRIVACY_SINKS) {
    if (allowAnalytics && (name === 'network request' || name === 'referrer collection' || name === 'tracking marker')) continue;
    if (pattern.test(code)) failures.push(`${label}: forbidden ${name}`);
  }
  if (/\b(?:window|globalThis|self|document|navigator|location)\s*\[/.test(code)) failures.push(`${label}: unresolved computed global access`);
  if (/\b(?:const|let|var)\s+\w+\s*=\s*(?:window|globalThis|self)\s*;[\s\S]*?\b\w+\s*\[/.test(code)) failures.push(`${label}: computed access through global alias`);
  return failures;
}

function hrefFormFailures(html, route) {
  const failures = [];
  for (const match of html.matchAll(/<form\b([^>]*)>/gi)) {
    const attributes = parseAttributes(match[1]);
    if (attributes.has('action') && (attributes.get('action') || '').trim()) failures.push(`${route}: protected form has a submission action`);
  }
  for (const match of html.matchAll(/<(?:input|textarea|select)\b([^>]*)>/gi)) {
    const attributes = parseAttributes(match[1]);
    if ((attributes.get('name') || '').trim()) failures.push(`${route}: protected form has serializable named control`);
  }
  return failures;
}

function sha256(source) {
  return createHash('sha256').update(source).digest('hex');
}

async function assertPinnedFiles(rootReal, failures) {
  for (const [relative, expected] of PINNED_MEASUREMENT_FILES) {
    const file = path.resolve(rootReal, relative);
    try {
      const source = await readFile(file);
      if (sha256(source) !== expected) failures.push(`pinned measurement file changed: ${relative}`);
    } catch (error) {
      failures.push(`pinned measurement file unavailable: ${relative}: ${error.code ?? error.message}`);
    }
  }
}

async function inspectProtectedSurface({ rootReal, route, file, expectedFiles, expectedInline, failures }) {
  const htmlFile = path.resolve(rootReal, file);
  let html;
  try { html = await readFile(htmlFile, 'utf8'); }
  catch (error) { failures.push(`${route}: unavailable: ${error.code ?? error.message}`); return; }
  if (/\b(?:analytics|telemetry|tracking|gtag|googletagmanager|dataLayer|plausible|matomo|segment|mixpanel|hotjar|clarity|pixel)\b/i.test(executableSource(html))) failures.push(`${route}: analytics script or marker present`);
  failures.push(...hrefFormFailures(html, route));
  try {
    const scripts = extractExecutableScripts(html, route);
    const inline = scripts.filter(({ src }) => !src).map(({ inline }) => sha256(inline)).sort();
    if (JSON.stringify(inline) !== JSON.stringify([...expectedInline].sort())) failures.push(`${route}: protected surface inline executable set changed`);
    const files = await buildLocalScriptClosure({ root: rootReal, htmlFile: file });
    const relativeFiles = [...files.keys()].map((entry) => path.relative(rootReal, entry).replaceAll(path.sep, '/')).sort();
    if (JSON.stringify(relativeFiles) !== JSON.stringify([...expectedFiles].sort())) failures.push(`${route}: protected surface dependency set changed`);
    for (const [absolute, source] of files) failures.push(...forbiddenSignals(source, `${route}:${path.relative(rootReal, absolute)}`));
    for (const script of scripts.filter(({ src }) => !src)) failures.push(...forbiddenSignals(script.inline, `${route}:inline`));
  } catch (error) { failures.push(`${route}: ${error.message}`); }
}

async function inspectVisitorAnalytics(rootReal, failures) {
  const analyticsPath = path.resolve(rootReal, ANALYTICS_FILE);
  let source;
  try { source = await readFile(analyticsPath, 'utf8'); }
  catch (error) { failures.push(`${ANALYTICS_FILE}: unavailable: ${error.code ?? error.message}`); return; }
  const code = executableSource(source);
  const fetches = [...code.matchAll(/\bfetch\s*\(/g)].length;
  if (fetches !== 1) failures.push(`${ANALYTICS_FILE}: expected exactly one fetch, found ${fetches}`);
  if (/\b(?:XMLHttpRequest|sendBeacon|WebSocket|EventSource|WebTransport)\b/.test(code)) failures.push(`${ANALYTICS_FILE}: unapproved network primitive`);
  if (/\b(?:const|let|var)\s+\w+\s*=\s*fetch\s*[;,]/.test(code)) failures.push(`${ANALYTICS_FILE}: fetch aliases are not allowed`);
  if (!code.includes(APPROVED_ANALYTICS_ORIGIN)) failures.push(`${ANALYTICS_FILE}: missing exact approved Supabase origin`);
  if (!/credentials\s*:\s*['"]omit['"]/.test(code)) failures.push(`${ANALYTICS_FILE}: credentials must be omit`);
  for (const key of SAFE_PAYLOAD_KEYS) if (!code.includes(key)) failures.push(`${ANALYTICS_FILE}: missing payload key ${key}`);
  const forbiddenKeys = /\b(?:user_?id|session_?id|visitor_?id|email|phone|story|message|query|search|text|content|name|ip|address)\b/i;
  const payload = code.match(/const\s+payload\s*=\s*\{([\s\S]*?)\};/)?.[1] ?? '';
  if (forbiddenKeys.test(payload)) failures.push(`${ANALYTICS_FILE}: payload contains identifier or free-text field`);
  if (/\b(?:localStorage|sessionStorage|indexedDB|cookieStore|document\s*\.\s*cookie)\b/.test(code)) failures.push(`${ANALYTICS_FILE}: persistent identifier storage is forbidden`);
  if (/\b(?:location|document)\s*\.\s*(?:search|hash)\b|\bURLSearchParams\b/.test(code)) failures.push(`${ANALYTICS_FILE}: query or hash collection is forbidden`);
  if (/\b(?:window|globalThis|self)\s*\[/.test(code)) failures.push(`${ANALYTICS_FILE}: unresolved computed global access`);
}

async function inspectHomepage(rootReal, failures) {
  const htmlFile = path.resolve(rootReal, 'index.html');
  let html;
  try { html = await readFile(htmlFile, 'utf8'); }
  catch (error) { failures.push(`homepage unavailable: ${error.code ?? error.message}`); return []; }
  let files = new Map();
  try {
    const scripts = extractExecutableScripts(html, 'homepage');
    const unexpectedInline = scripts.filter(({ src }) => !src && executableSource(src.inline).trim());
    if (unexpectedInline.length) failures.push('homepage has unapproved inline executable code');
    files = await buildLocalScriptClosure({ root: rootReal, htmlFile: 'index.html', allowExternal: true });
  } catch (error) { failures.push(`homepage dependency graph: ${error.message}`); return []; }
  const relativeFiles = [...files.keys()].map((entry) => path.relative(rootReal, entry).replaceAll(path.sep, '/')).sort();
  if (JSON.stringify(relativeFiles) !== JSON.stringify([...APPROVED_HOME_CLOSURE].sort())) failures.push('homepage dependency set changed');
  if (!relativeFiles.includes(ANALYTICS_FILE)) failures.push('homepage does not reach visitor-analytics.js through its real dependency graph');
  for (const [absolute, source] of files) {
    const relative = path.relative(rootReal, absolute).replaceAll(path.sep, '/');
    if (relative === ANALYTICS_FILE) continue;
    const code = executableSource(source);
    if (/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|WebTransport)\b/.test(code)) failures.push(`${relative}: unapproved direct network primitive`);
    for (const specifier of scriptSpecifiers(source)) {
      if (/^(?:https?:)?\/\//i.test(specifier) && specifier !== APPROVED_HOME_EXTERNAL_MODULE) failures.push(`${relative}: unapproved external module ${specifier}`);
    }
  }
  return relativeFiles;
}

async function inspectMeasurementBaseline(rootReal, failures) {
  for (const file of MEASUREMENT_BASELINE) {
    const absolute = path.resolve(rootReal, file);
    let html;
    try { html = await readFile(absolute, 'utf8'); }
    catch (error) { failures.push(`measurement baseline unavailable: ${file}: ${error.code ?? error.message}`); continue; }
    if (file !== 'index.html' && !html.includes('/public-page-runtime.js')) failures.push(`measurement baseline lost analytics wiring: ${file}`);
    let scripts = [];
    try { scripts = extractExecutableScripts(html, file); }
    catch (error) { failures.push(`${file}: ${error.message}`); continue; }
    for (const script of scripts.filter(({ src }) => !src)) failures.push(...forbiddenSignals(script.inline, `${file}:inline`));
  }
}

async function inspectAnalyticsStorage(rootReal, failures) {
  const relative = 'supabase/migrations/20260830002000_add_privacy_safe_pageview_analytics.sql';
  let sql;
  try { sql = await readFile(path.resolve(rootReal, relative), 'utf8'); }
  catch (error) { failures.push(`${relative}: unavailable: ${error.code ?? error.message}`); return; }
  if (/\b(?:user_?id|session_?id|visitor_?id|email|phone|story|message|query|search|free_?text|content|full_?url|ip_?address)\b/i.test(sql)) failures.push(`${relative}: forbidden identifier or free-text column`);
  const required = ['security definer', 'auth.uid() is not null', 'p_country_code', 'p_device_class', 'p_path', 'p_referrer_host'];
  for (const marker of required) if (!sql.includes(marker)) failures.push(`${relative}: missing invariant: ${marker}`);
}

async function inspectSafetyInventory(rootReal, failures) {
  const inventory = await readFile(path.resolve(rootReal, 'SAFETY_ROUTE_INVENTORY.md'), 'utf8');
  const routes = [...inventory.matchAll(/^\| `([^`]+)` \|/gm)].map((match) => match[1]);
  const unique = new Set(routes);
  if (routes.length !== unique.size) failures.push('Safety inventory has duplicate routes');
  for (const route of routes) {
    if (!route.startsWith('/') || route.includes('..') || route.includes('?') || route.includes('#')) failures.push(`invalid Safety route: ${route}`);
  }
  const expected = new Set(['/ayuda-urgente.html','/alguien-cercano-ha-intentado-suicidarse/','/duelo/ha-muerto-por-suicidio-alguien-que-quiero/','/familia/mi-hijo-sufre-acoso-escolar-y-no-se-que-hacer/','/familia/un-familiar-tiene-una-adiccion-y-no-se-como-ayudarle/','/he-sufrido-una-agresion-sexual-y-no-se-que-hacer/','/me-preocupa-que-alguien-pueda-suicidarse/','/mi-pareja-me-maltrata-y-no-se-que-hacer/']);
  if (unique.size !== expected.size || [...expected].some((route) => !unique.has(route))) failures.push('Safety inventory route sets differ');
}

export async function auditLaunchMeasurementSafety({ root = DEFAULT_ROOT } = {}) {
  const rootReal = await realpath(root);
  const failures = [];
  await assertPinnedFiles(rootReal, failures);
  await inspectVisitorAnalytics(rootReal, failures);
  const homepageDependencyFiles = await inspectHomepage(rootReal, failures);
  await inspectProtectedSurface({ rootReal, route: '/buscar/', file: 'buscar/index.html', expectedFiles: APPROVED_SEARCH_CLOSURE, expectedInline: [], failures });
  await inspectProtectedSurface({ rootReal, route: '/ayuda-urgente.html', file: 'ayuda-urgente.html', expectedFiles: [], expectedInline: APPROVED_PROTECTED_INLINE.get('/ayuda-urgente.html') ?? [], failures });
  await inspectMeasurementBaseline(rootReal, failures);
  await inspectAnalyticsStorage(rootReal, failures);
  await inspectSafetyInventory(rootReal, failures);
  return {
    decision: failures.length ? 'HOLD' : 'MEASUREMENT_GO_WITH_SELECTIVE_EXPANSION',
    hard_failures: failures,
    homepage_dependency_files: homepageDependencyFiles,
    measurement_baseline: [...MEASUREMENT_BASELINE],
    protected_surfaces: [
      { route: '/buscar/', analytics_allowed: false, dependency_files: [...APPROVED_SEARCH_CLOSURE] },
      { route: '/ayuda-urgente.html', analytics_allowed: false, dependency_files: [] },
    ],
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = await auditLaunchMeasurementSafety();
  console.log(JSON.stringify(report, null, 2));
  if (report.decision === 'HOLD') process.exitCode = 1;
}
