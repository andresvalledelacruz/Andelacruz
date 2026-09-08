import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchContentCatalog } from '../src/search-content-catalog.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://desgracias.es';
const errors = [];
const warnings = [];
const checks = [];

function read(relative) {
  const file = path.join(ROOT, relative);
  if (!fs.existsSync(file)) {
    errors.push(`Missing required file: ${relative}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

function pass(name, detail = '') {
  checks.push({ name, status: 'PASS', detail });
}

function fail(name, detail) {
  checks.push({ name, status: 'FAIL', detail });
  errors.push(`${name}: ${detail}`);
}

function warn(name, detail) {
  checks.push({ name, status: 'MANUAL', detail });
  warnings.push(`${name}: ${detail}`);
}

function htmlPathForUrl(url) {
  const parsed = new URL(url);
  let relative = decodeURIComponent(parsed.pathname).replace(/^\//, '');
  if (!relative) return 'index.html';
  if (relative.endsWith('/')) return `${relative}index.html`;
  return relative;
}

function canonicalFrom(html) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of tags) {
    if (!/\brel=["']canonical["']/i.test(tag)) continue;
    const href = tag.match(/\bhref=["']([^"']+)["']/i);
    if (href) return href[1];
  }
  return null;
}

function robotsContent(html) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    if (!/\bname=["']robots["']/i.test(tag)) continue;
    const content = tag.match(/\bcontent=["']([^"']+)["']/i);
    if (content) return content[1].toLowerCase();
  }
  return '';
}

const required = [
  'index.html',
  'buscar/index.html',
  'ayuda-urgente.html',
  'privacidad.html',
  '404.html',
  'robots.txt',
  'sitemap.xml',
  'CNAME',
  'search-home-entry.js'
];
const missing = required.filter((file) => !fs.existsSync(path.join(ROOT, file)));
if (missing.length) fail('required-launch-surfaces', missing.join(', '));
else pass('required-launch-surfaces', `${required.length} required files present`);

const cname = read('CNAME').trim();
if (cname === 'desgracias.es') pass('canonical-domain', cname);
else fail('canonical-domain', `CNAME is ${JSON.stringify(cname)}`);

const robots = read('robots.txt');
const requiredRobotRules = [
  'Allow: /',
  'Disallow: /.github/',
  'Disallow: /docs/',
  'Disallow: /frontend/',
  'Disallow: /ops/',
  'Disallow: /src/',
  'Disallow: /tests/',
  'Sitemap: https://desgracias.es/sitemap.xml'
];
const missingRobotRules = requiredRobotRules.filter((rule) => !robots.includes(rule));
if (missingRobotRules.length) fail('robots-policy', missingRobotRules.join(' | '));
else pass('robots-policy', 'public root allowed, internal surfaces disallowed, sitemap declared');

const sitemap = read('sitemap.xml');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
if (locs.length < 50) fail('sitemap-size', `only ${locs.length} URLs`);
else pass('sitemap-size', `${locs.length} URLs`);

if (new Set(locs).size !== locs.length) fail('sitemap-uniqueness', 'duplicate loc entries found');
else pass('sitemap-uniqueness', 'all loc entries unique');

const invalidOrigin = locs.filter((loc) => !loc.startsWith(`${ORIGIN}/`) && loc !== `${ORIGIN}/`);
if (invalidOrigin.length) fail('sitemap-origin', invalidOrigin.join(', '));
else pass('sitemap-origin', 'all sitemap URLs use the canonical origin');

const forbiddenSitemap = locs.filter((loc) => /\/(?:docs|frontend|ops|src|tests|\.github)\//.test(loc));
if (forbiddenSitemap.length) fail('sitemap-public-only', forbiddenSitemap.join(', '));
else pass('sitemap-public-only', 'no internal paths exposed in sitemap');

const missingTargets = [];
const canonicalMismatches = [];
const noindexInSitemap = [];
for (const loc of locs) {
  const relative = htmlPathForUrl(loc);
  const file = path.join(ROOT, relative);
  if (!fs.existsSync(file)) {
    missingTargets.push(`${loc} -> ${relative}`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const canonical = canonicalFrom(html);
  if (canonical !== loc) canonicalMismatches.push(`${loc} -> ${canonical || 'MISSING'}`);
  if (robotsContent(html).includes('noindex')) noindexInSitemap.push(loc);
}
if (missingTargets.length) fail('sitemap-targets', missingTargets.join(' | '));
else pass('sitemap-targets', 'every sitemap URL resolves to a deployable file');
if (canonicalMismatches.length) fail('canonical-integrity', canonicalMismatches.join(' | '));
else pass('canonical-integrity', 'every sitemap URL self-canonicalizes');
if (noindexInSitemap.length) fail('indexability-consistency', noindexInSitemap.join(', '));
else pass('indexability-consistency', 'no sitemap URL is marked noindex');

const home = read('index.html');
if (canonicalFrom(home) === `${ORIGIN}/`) pass('homepage-canonical', `${ORIGIN}/`);
else fail('homepage-canonical', canonicalFrom(home) || 'missing');

const search = read('buscar/index.html');
if (canonicalFrom(search) === `${ORIGIN}/buscar/`) pass('search-canonical', `${ORIGIN}/buscar/`);
else fail('search-canonical', canonicalFrom(search) || 'missing');
if (robotsContent(search).includes('noindex')) {
  warn('search-indexability', 'Search remains noindex,follow for controlled launch; remove noindex only when Search itself should enter Google.');
} else {
  pass('search-indexability', 'Search is indexable');
}

const searchEntry = read('search-home-entry.js');
const entrySignals = ['main-nav', 'hero', 'needs', 'footer'];
const missingEntries = entrySignals.filter((signal) => !searchEntry.includes(`searchEntry = '${signal}'`));
if (missingEntries.length) fail('search-discoverability', missingEntries.join(', '));
else pass('search-discoverability', 'Search is exposed from nav, hero, orientation card and footer');

const catalog = searchContentCatalog();
if (catalog.length >= 35) pass('search-content-coverage', `${catalog.length} ordinary content intents plus authoritative Safety routing`);
else fail('search-content-coverage', `only ${catalog.length} ordinary content intents`);
const brokenCatalogTargets = catalog.filter(({ url }) => !fs.existsSync(path.join(ROOT, htmlPathForUrl(`${ORIGIN}${url}`))));
if (brokenCatalogTargets.length) fail('search-content-targets', brokenCatalogTargets.map(({ intent, url }) => `${intent}:${url}`).join(' | '));
else pass('search-content-targets', 'all content-search destinations exist');

const notFound = read('404.html');
if (robotsContent(notFound).includes('noindex') && /href=["']\/["']/.test(notFound)) {
  pass('404-safety', '404 is noindex and returns users to the site');
} else {
  fail('404-safety', '404 must be noindex and link back to /');
}

const provenance = read('COPYRIGHT_ASSET_PROVENANCE.md');
if (provenance.includes('`PENDING_PROVENANCE`') && provenance.includes('assets/manos-apoyo.png')) {
  warn('asset-provenance', 'manos-apoyo remains PENDING_PROVENANCE; human evidence is still required.');
} else {
  pass('asset-provenance', 'no known pending V9 asset marker detected');
}

const report = {
  version: 1,
  launch_target: 'controlled_public_launch',
  hard_failures: errors.length,
  manual_holds: warnings.length,
  decision: errors.length ? 'HOLD' : 'TECHNICAL_GO_WITH_MANUAL_HOLDS',
  checks,
  errors,
  warnings
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
