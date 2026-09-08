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
  ['buscar/index.html', '0b4b89c45cc807a4aaccec48313ed5155af217611dfc926c291d1335dddbb567'],
  ['app-core.js', 'db6908a65b1696a6926aa6271e8b9435cbe58f5f92d26746db6150cafbd95092'],
  ['next-step-adapter.js', '488372c8bde96402afe8bf87fae0a6ff368a06e9cab69c3090f7e03419436641'],
  ['next-step-guidance.js', 'ead14c25e029c01173f01f1cae6047e13644b329e073d6792da8f8e8c8268915'],
  ['resource-links.js', '5c27a72111173769c899daf9e7ff1945045e01eb035945d7142643c1a445a6a7'],
  ['search-home-entry.js', 'd4d9f174706b7b89da6861ce8c10b0b437d20d276c00c68266d80faee14418c5'],
  ['urgent-help-nav.js', '118be1f2b753ae750f9b51eff69dda6ea8834df2734d014dabd314b2e3f221b7'],
  ['src/search-clarification.js', '4044c9d91594583cb3ff78eb696c0eca73257dd558917ebf81ba5493f63ee55c'],
  ['src/search-content-catalog.js', '6c76e5357d885ff55932581cf5982e6a0fd736f8136371dd0f0774e498032abe'],
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
  return { root: rootReal, entry, html, scripts, inline, files };
}

function auditProtectedCode(label, source, failures) {
  let code;
  try { code = executableSource(source); }
  catch (error) { failures.push(`${label}: ${error.message}`); return; }
  for (const [name, pattern] of PRIVACY_SINKS) if (pattern.test(code)) failures.push(`${label}: forbidden ${name}`);
  if (/(?:window|document|navigator|location|globalThis)\s*\[/.test(code)) failures.push(`${label}: unresolved computed global access`);
  const globalAliases = new Set();
  for (const match of code.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:window|document|navigator|location|globalThis)\b/g)) globalAliases.add(match[1]);
  for (const alias of globalAliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\s*\\[`).test(code)) failures.push(`${label}: unresolved computed access through global alias ${alias}`);
  }
}

export async function auditHtmlEntry({ root = DEFAULT_ROOT, htmlFile, protectedSurface = true }) {
  const failures = [];
  let closure;
  try { closure = await buildLocalScriptClosure({ root, htmlFile }); }
  catch (error) { return { htmlFile, failures: [`${htmlFile}: ${error.message}`], files: [] }; }
  if (protectedSurface) {
    if (/\son[a-z]+\s*=/i.test(closure.html)) failures.push(`${htmlFile}: inline event handler`);
    if (/<meta\b[^>]*http-equiv\s*=\s*['"]?refresh/i.test(closure.html)) failures.push(`${htmlFile}: meta refresh`);
    for (const match of closure.html.matchAll(/<form\b([^>]*)>/gi)) {
      const attributes = parseAttributes(match[1]);
      if (attributes.has('action') && attributes.get('action').trim() !== '') failures.push(`${htmlFile}: protected form has a submission action`);
    }
    if (/<(?:input|textarea|select)\b[^>]*\bname\s*=/i.test(closure.html)) failures.push(`${htmlFile}: protected form has a serializable named control`);
    for (const script of closure.scripts) if (script.src && ANALYTICS_MARKERS.test(script.src)) failures.push(`${htmlFile}: analytics script ${script.src}`);
    for (const item of closure.inline) auditProtectedCode(item.label, item.source, failures);
    for (const [file, source] of closure.files) auditProtectedCode(path.relative(closure.root, file), source, failures);
  }
  const inlineHashes = closure.inline
    .filter((item) => stripComments(item.source).trim())
    .map((item) => createHash('sha256').update(item.source).digest('hex'))
    .sort();
  return { htmlFile, failures: [...new Set(failures)], files: [...closure.files.keys()].map((file) => path.relative(closure.root, file)).sort(), inline_hashes: inlineHashes };
}

export async function auditAnalyticsRuntime({ root = DEFAULT_ROOT, analyticsFile = ANALYTICS_FILE }) {
  const failures = [];
  const rootReal = await realpath(root);
  const file = await realpath(path.resolve(rootReal, analyticsFile));
  const raw = await readFile(file, 'utf8');
  let code;
  try { code = executableSource(raw); }
  catch (error) { return { failures: [error.message] }; }
  const calls = [...code.matchAll(/\bfetch\s*\(/g)];
  if (calls.length !== 1) failures.push(`analytics runtime must make exactly one fetch, found ${calls.length}`);
  if ([...code.matchAll(/\bfetch\b/g)].length !== 1) failures.push('analytics runtime must contain exactly one fetch reference and no aliases');
  if (/\b(?:XMLHttpRequest|sendBeacon|WebSocket|EventSource|WebTransport)\b/.test(code)) failures.push('analytics runtime contains an unapproved network primitive');
  if (!/record_privacy_safe_pageview/.test(code)) failures.push('analytics runtime must call the approved aggregate RPC');
  const originPattern = /const\s+SUPABASE_URL\s*=\s*(['"])(https?:\/\/[^'"]+)\1/;
  const configuredOrigin = code.match(originPattern)?.[2] ?? '';
  if (configuredOrigin !== APPROVED_ANALYTICS_ORIGIN) failures.push('analytics runtime must use the exact approved Supabase origin');
  if (!/method\s*:\s*['"]POST['"]/i.test(code)) failures.push('analytics runtime must use POST');
  if (!/credentials\s*:\s*['"]omit['"]/.test(code)) failures.push("analytics runtime must use credentials: 'omit'");
  if (/credentials\s*:\s*['"](?:include|same-origin)['"]/.test(code)) failures.push('analytics runtime contains unsafe credentials mode');
  for (const [name, pattern] of PRIVACY_SINKS.filter(([name]) => !['network request', 'referrer collection', 'tracking marker'].includes(name))) {
    if (pattern.test(code)) failures.push(`analytics runtime uses forbidden ${name}`);
  }
  if (/(?:location|document)\s*\.\s*(?:search|hash|href|URL)\b|\bURLSearchParams\b/.test(code)) failures.push('analytics runtime reads sensitive URL state');
  if (/\b(?:authorization|bearer|service[_-]?role|jwt|secret|email|phone|userAgent|screen\s*\.|canvas|hardwareConcurrency)\b/i.test(code)) failures.push('analytics runtime contains a sensitive credential or fingerprint field');
  const payload = code.match(/const\s+payload\s*=\s*\{([\s\S]*?)\}\s*;/)?.[1] ?? '';
  const keys = [...payload.matchAll(/\b(p_[a-z_]+)\s*:/g)].map((match) => match[1]).sort();
  if (JSON.stringify(keys) !== JSON.stringify(SAFE_PAYLOAD_KEYS)) failures.push(`analytics payload keys must be exactly ${SAFE_PAYLOAD_KEYS.join(', ')}`);
  if (!/window\s*\.\s*location\s*\.\s*pathname/.test(code)) failures.push('analytics path must derive from pathname');
  if (!/new\s+URL\s*\(\s*document\s*\.\s*referrer\s*\)\s*\.\s*hostname/.test(code)) failures.push('referrer must be reduced directly to hostname');
  if (/(?:window|document|navigator|location|globalThis)\s*\[/.test(code)) failures.push('analytics runtime has unresolved computed global access');
  return { failures: [...new Set(failures)], payload_keys: keys };
}

async function auditAnalyticsStorage(rootReal) {
  const failures = [];
  const migrationFile = path.join(rootReal, 'supabase/migrations/20260830002000_add_privacy_safe_pageview_analytics.sql');
  let sql;
  try { sql = await readFile(migrationFile, 'utf8'); }
  catch (error) { return { failures: [`analytics migration unavailable: ${error.message}`] }; }
  const normalized = sql
    .replace(/--[^\n\r]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .toLowerCase();
  for (const required of [
    'create table if not exists public.pageview_daily_analytics',
    'primary key (day, path, referrer_host, country_code, device_class)',
    'alter table public.pageview_daily_analytics enable row level security',
    'revoke all on public.pageview_daily_analytics from anon, authenticated',
    'security definer',
    'set search_path = public',
    'split_part(coalesce(p_path',
    'grant execute on function public.record_privacy_safe_pageview(text,text,text,text) to anon, authenticated',
  ]) if (!normalized.includes(required)) failures.push(`analytics migration missing invariant: ${required}`);
  const tableBody = normalized.match(/create table if not exists public\.pageview_daily_analytics\s*\(([\s\S]*?)\);/)?.[1] ?? '';
  if (!tableBody) failures.push('analytics table definition was not parsed');
  if (/\b(?:ip|ip_address|user_id|session_id|visitor_id|email|phone|query|free_text|payload)\b/.test(tableBody)) failures.push('analytics table contains a forbidden identifier or free-text column');
  return { failures: [...new Set(failures)] };
}

function routesFromInventory(markdown) {
  const section = markdown.split('## P0/P1 — monetización denegada por construcción')[1]?.split('\n## ')[0] ?? '';
  return [...section.matchAll(/^\|\s*`(\/[^`]+)`\s*\|/gm)].map((match) => match[1]);
}

function routesFromPolicy(markdown) {
  const section = markdown.match(/## Inventario automatizado actual([\s\S]*?)(?=\n## )/)?.[1] ?? '';
  return [...section.matchAll(/`(\/[^`]+)`/g)].map((match) => match[1]);
}

function routeToFile(route) {
  const normalized = route.replace(/^\/+/, '');
  return normalized.endsWith('.html') ? normalized : `${normalized.replace(/\/+$/, '')}/index.html`;
}

export async function auditLaunchMeasurementSafety({ root = DEFAULT_ROOT } = {}) {
  const rootReal = await realpath(root);
  const failures = [];
  const pinnedFiles = [];
  for (const [file, expected] of PINNED_MEASUREMENT_FILES) {
    try {
      const source = await readFile(path.join(rootReal, file));
      const actual = createHash('sha256').update(source).digest('hex');
      pinnedFiles.push({ file, expected_sha256: expected, actual_sha256: actual });
      if (actual !== expected) failures.push(`pinned measurement file changed: ${file}`);
    } catch (error) { failures.push(`pinned measurement file unavailable: ${file}: ${error.message}`); }
  }
  const inventory = routesFromInventory(await readFile(path.join(rootReal, 'SAFETY_ROUTE_INVENTORY.md'), 'utf8'));
  const policy = routesFromPolicy(await readFile(path.join(rootReal, 'SAFETY_MONETIZATION_POLICY.md'), 'utf8'));
  if (!inventory.length) failures.push('Safety inventory has no P0/P1 routes');
  if (new Set(inventory).size !== inventory.length) failures.push('Safety inventory contains duplicate routes');
  if (JSON.stringify([...inventory].sort()) !== JSON.stringify([...policy].sort())) failures.push('Safety inventory and monetization policy route sets differ');
  const routeFiles = inventory.map(routeToFile);
  if (new Set(routeFiles).size !== routeFiles.length) failures.push('Safety routes collide on the same file');

  const surfaces = [];
  for (const [route, htmlFile] of [...inventory.map((route) => [route, routeToFile(route)]), ['/buscar/', 'buscar/index.html']]) {
    if (route.includes('..') || !route.startsWith('/')) { failures.push(`invalid Safety route: ${route}`); continue; }
    const result = await auditHtmlEntry({ root: rootReal, htmlFile, protectedSurface: true });
    surfaces.push({ route, ...result });
    failures.push(...result.failures);
    const approved = route === '/buscar/' ? APPROVED_SEARCH_CLOSURE : [];
    if (JSON.stringify(result.files) !== JSON.stringify(approved)) failures.push(`protected surface dependency set changed: ${route}`);
    if (route !== '/buscar/') {
      const approvedInline = APPROVED_PROTECTED_INLINE.get(route) ?? [];
      if (JSON.stringify(result.inline_hashes ?? []) !== JSON.stringify(approvedInline)) failures.push(`protected surface inline executable set changed: ${route}`);
    }
  }

  let homeFiles = [];
  try {
    const home = await buildLocalScriptClosure({ root: rootReal, htmlFile: 'index.html', allowExternal: true });
    homeFiles = [...home.files.keys()].map((file) => path.relative(rootReal, file)).sort();
    if (!homeFiles.includes(ANALYTICS_FILE)) failures.push('homepage dependency graph does not reach visitor-analytics.js');
    if (JSON.stringify(homeFiles) !== JSON.stringify(APPROVED_HOME_CLOSURE)) failures.push('homepage dependency set changed');
    if (home.inline.some((item) => stripComments(item.source).trim())) failures.push('homepage has unapproved inline executable code');
    for (const [file, source] of home.files) {
      const relative = path.relative(rootReal, file);
      if (relative !== ANALYTICS_FILE && /\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|WebTransport)\b/.test(executableSource(source))) {
        failures.push(`homepage dependency ${relative} contains an unapproved direct network primitive`);
      }
      for (const specifier of scriptSpecifiers(source).filter((item) => /^(?:https?:)?\/\//i.test(item))) {
        if (specifier !== APPROVED_HOME_EXTERNAL_MODULE) failures.push(`homepage dependency ${relative} loads an unapproved external module: ${specifier}`);
      }
    }
  } catch (error) { failures.push(`homepage dependency graph: ${error.message}`); }
  const analytics = await auditAnalyticsRuntime({ root: rootReal });
  failures.push(...analytics.failures);
  const storage = await auditAnalyticsStorage(rootReal);
  failures.push(...storage.failures);

  const measuredBaseline = [];
  for (const htmlFile of MEASUREMENT_BASELINE) {
    try {
      const closure = await buildLocalScriptClosure({ root: rootReal, htmlFile, allowExternal: true });
      const files = [...closure.files.keys()].map((file) => path.relative(rootReal, file));
      if (!files.includes(ANALYTICS_FILE)) failures.push(`measurement baseline lost analytics wiring: ${htmlFile}`);
      else measuredBaseline.push(htmlFile);
      if (htmlFile !== 'index.html') {
        for (const script of closure.scripts) {
          if (script.src && script.src !== '/public-page-runtime.js') failures.push(`measurement baseline ${htmlFile} has an unapproved script: ${script.src}`);
          if (!script.src) auditProtectedCode(`${htmlFile}:inline`, script.inline, failures);
          if (!script.src && stripComments(script.inline).trim()) failures.push(`measurement baseline ${htmlFile} has unapproved inline executable code`);
        }
      }
    } catch (error) { failures.push(`measurement baseline ${htmlFile}: ${error.message}`); }
  }
  for (const protectedFile of [...routeFiles, 'buscar/index.html']) {
    if (MEASUREMENT_BASELINE.includes(protectedFile)) failures.push(`protected surface entered measurement baseline: ${protectedFile}`);
  }

  for (const file of [ANALYTICS_FILE, 'index.html', ...routeFiles, 'buscar/index.html']) {
    try { await stat(path.join(rootReal, file)); }
    catch { failures.push(`required launch file missing: ${file}`); }
  }
  const uniqueFailures = [...new Set(failures)].sort();
  return {
    decision: uniqueFailures.length ? 'HOLD' : 'MEASUREMENT_GO_WITH_SELECTIVE_EXPANSION',
    hard_failures: uniqueFailures,
    protected_routes: inventory,
    protected_surfaces: surfaces,
    homepage_dependency_files: homeFiles,
    analytics,
    analytics_storage: storage,
    pinned_measurement_files: pinnedFiles,
    measurement_baseline: measuredBaseline,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await auditLaunchMeasurementSafety();
  console.log(JSON.stringify(report, null, 2));
  if (report.hard_failures.length) process.exitCode = 1;
}
