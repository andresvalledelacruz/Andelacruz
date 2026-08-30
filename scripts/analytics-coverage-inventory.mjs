import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { isIndexable } from './lib/robots-indexability.mjs';

const root = new URL('..', import.meta.url).pathname;
const ignoredDirs = new Set(['.git', 'node_modules', 'ops-api', 'supabase', 'tests', 'scripts', '.github']);
const ignoredFiles = new Set(['404.html']);
const marker = '/public-page-runtime.js';

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
const rows = [];
for (const file of files) {
  const html = await readFile(file, 'utf8');
  const rel = relative(root, file).split(sep).join('/');
  if (!isIndexable(html)) continue;
  const homepage = rel === 'index.html';
  const hasAnalytics = homepage
    ? /<script\s+src=["']app\.js["']/i.test(html)
    : html.includes(marker);
  rows.push({ file: rel, analytics: hasAnalytics ? 'yes' : 'no' });
}

rows.sort((a, b) => a.file.localeCompare(b.file));
const covered = rows.filter(r => r.analytics === 'yes').length;
const missing = rows.length - covered;
console.log(JSON.stringify({ indexable_html: rows.length, covered, missing, pages: rows }, null, 2));
if (process.argv.includes('--fail-on-missing') && missing > 0) process.exitCode = 1;
