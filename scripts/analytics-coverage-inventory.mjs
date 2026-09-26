import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { isIndexable } from './lib/robots-indexability.mjs';
import { readCriticalRoutes, routeToFile } from './lib/p0-p1-resource-policy.mjs';

const root = new URL('..', import.meta.url).pathname;
const ignoredDirs = new Set(['.git', 'node_modules', 'ops-api', 'supabase', 'tests', 'scripts', '.github']);
const ignoredFiles = new Set(['404.html']);
const runtimeMarker = '/public-page-runtime.js';
const directMarker = '/visitor-analytics.js';
// Existing contracts deliberately keep these pages free of the visitor beacon.
// Do not infer the same rule for every P0/P1 page: those need a separate review.
const explicitlyUnmeasured = new Set([
  'internacional.html',
  'recursos/index.html',
  ...['es', 'en', 'fr', 'pt'].map(lang => `ayuda/${lang}/index.html`),
]);

async function walk(dir, out = []) {
  for (const name of await readdir(dir)) {
    if (ignoredDirs.has(name)) continue;
    const full = join(dir, name);
    const s = await stat(full);
    if (s.isDirectory()) await walk(full, out);
    else if (name.endsWith('.html') && !ignoredFiles.has(name)) out.push(full);
  }
  return out;
}

const files = await walk(root);
const criticalFiles = new Set((await readCriticalRoutes()).map(routeToFile));
const rows = [];
for (const file of files) {
  const html = await readFile(file, 'utf8');
  const rel = relative(root, file).split(sep).join('/');
  if (!isIndexable(html)) continue;
  const homepage = rel === 'index.html';
  const hasAnalytics = homepage
    ? /<script\s+src=["']app\.js["']/i.test(html)
    : html.includes(runtimeMarker) || html.includes(directMarker);
  const status = hasAnalytics ? 'covered'
    : explicitlyUnmeasured.has(rel) ? 'explicitly_unmeasured'
      : criticalFiles.has(rel) ? 'safety_review'
        : 'review_needed';
  rows.push({ file: rel, analytics: hasAnalytics ? 'yes' : 'no', status });
}

rows.sort((a, b) => a.file.localeCompare(b.file));
const covered = rows.filter(r => r.analytics === 'yes').length;
const missing = rows.length - covered;
const breakdown = Object.fromEntries(['covered', 'explicitly_unmeasured', 'safety_review', 'review_needed']
  .map(status => [status, rows.filter(row => row.status === status).length]));
console.log(JSON.stringify({ indexable_html: rows.length, covered, missing, breakdown, pages: rows }, null, 2));
if (process.argv.includes('--fail-on-missing') && missing > 0) process.exitCode = 1;
