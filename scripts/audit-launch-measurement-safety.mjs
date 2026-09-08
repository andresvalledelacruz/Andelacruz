import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];
const checks = [];

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

function htmlPath(route) {
  const relative = route.replace(/^\//, '');
  return route.endsWith('/') ? `${relative}index.html` : relative;
}

function hasPageAnalytics(html) {
  return html.includes('/public-page-runtime.js') || html.includes('/visitor-analytics.js');
}

function record(name, ok, detail, level = 'error') {
  checks.push({ name, status: ok ? 'PASS' : level === 'warning' ? 'MANUAL' : 'FAIL', detail });
  if (!ok) (level === 'warning' ? warnings : errors).push(`${name}: ${detail}`);
}

const inventory = read('SAFETY_ROUTE_INVENTORY.md');
const safetyRoutes = [...inventory.matchAll(/^\| `([^`]+)` \|/gm)].map((match) => match[1]);
record('safety-route-inventory', safetyRoutes.length >= 7, `${safetyRoutes.length} P0/P1 routes parsed`);

for (const route of safetyRoutes) {
  const file = htmlPath(route);
  const full = path.join(ROOT, file);
  const exists = fs.existsSync(full);
  record(`safety-target:${route}`, exists, exists ? file : `missing ${file}`);
  if (!exists) continue;
  const html = fs.readFileSync(full, 'utf8');
  record(
    `no-page-analytics:${route}`,
    !hasPageAnalytics(html),
    hasPageAnalytics(html) ? 'page analytics detected on a P0/P1 surface' : 'no page analytics runtime on P0/P1 surface'
  );
}

const search = read('buscar/index.html');
record('search-no-page-analytics', !hasPageAnalytics(search), 'search text remains outside page analytics');
record('search-no-network-analytics', !/(visitor-analytics|record_privacy_safe_pageview|sendBeacon|analytics)/i.test(search), 'search UI contains no analytics client');

const analyticsRuntime = read('visitor-analytics.js');
record('analytics-no-credentials', analyticsRuntime.includes("credentials: 'omit'"), 'pageview request omits credentials');
record('analytics-no-cookie-storage', !/(document\.cookie|localStorage|sessionStorage|indexedDB)/.test(analyticsRuntime), 'analytics runtime does not read cookies or browser storage');
record('analytics-no-query-text', analyticsRuntime.includes('window.location.pathname') && !/location\.(?:search|hash)/.test(analyticsRuntime), 'analytics records pathname only, not query/hash text');

const sitemap = read('sitemap.xml');
const indexableRoutes = [...sitemap.matchAll(/<loc>https:\/\/desgracias\.es([^<]*)<\/loc>/g)]
  .map((match) => match[1] || '/')
  .filter((route) => !safetyRoutes.includes(route));
let covered = 0;
const missing = [];
for (const route of indexableRoutes) {
  const file = htmlPath(route);
  if (!fs.existsSync(path.join(ROOT, file))) continue;
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  if (route === '/' ? /<script\s+src=["']app\.js["']/i.test(html) : hasPageAnalytics(html)) covered += 1;
  else missing.push(route);
}
record('ordinary-measurement-baseline', covered >= 10, `${covered}/${indexableRoutes.length} non-P0/P1 indexable routes currently have aggregate pageview wiring`);
if (missing.length) {
  record('ordinary-measurement-coverage', false, `${missing.length} non-P0/P1 routes remain unmeasured; expand selectively after launch, never by overriding Safety`, 'warning');
} else {
  record('ordinary-measurement-coverage', true, 'all eligible routes covered');
}

const report = {
  version: 1,
  hard_failures: errors.length,
  manual_items: warnings.length,
  decision: errors.length ? 'HOLD' : 'MEASUREMENT_GO_WITH_SELECTIVE_EXPANSION',
  safety_routes: safetyRoutes.length,
  ordinary_indexable_routes: indexableRoutes.length,
  ordinary_covered: covered,
  ordinary_missing: missing.length,
  checks,
  errors,
  warnings
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
