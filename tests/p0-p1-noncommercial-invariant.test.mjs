import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const FORBIDDEN_COMMERCIAL_PATTERNS = [
  /adsbygoogle/i,
  /pagead2\.googlesyndication\.com/i,
  /data-ad-client/i,
  /data-ad-slot/i,
  /amazon-adsystem/i,
  /doubleclick\.net/i,
  /affiliate/i,
  /afiliad[oa]/i,
  /patrocinad[oa]/i,
  /\bcomprar\b/i,
  /\boferta comercial\b/i,
];

function routeToFile(route) {
  const normalized = route.replace(/^\/+/, '');
  return normalized.endsWith('.html') ? normalized : `${normalized.replace(/\/+$/, '')}/index.html`;
}

async function readCriticalInventory() {
  const markdown = await readFile(new URL('../SAFETY_ROUTE_INVENTORY.md', import.meta.url), 'utf8');
  const p0p1Section = markdown.split('## P0/P1 — monetización denegada por construcción')[1]?.split('\n## ')[0] ?? '';
  const rows = [];

  for (const line of p0p1Section.split('\n')) {
    const match = line.match(/^\|\s*`(\/[^`]+)`\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/);
    if (!match) continue;
    rows.push({ route: match[1], reason: match[2].trim(), invariant: match[3].trim() });
  }

  assert.ok(rows.length > 0, 'SAFETY_ROUTE_INVENTORY.md must contain at least one P0/P1 route');
  assert.equal(new Set(rows.map(({ route }) => route)).size, rows.length, 'P0/P1 inventory routes must be unique');
  return rows;
}

test('P0/P1 public routes remain non-commercial by construction', async () => {
  const criticalRoutes = await readCriticalInventory();

  for (const { route } of criticalRoutes) {
    const file = routeToFile(route);
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    for (const pattern of FORBIDDEN_COMMERCIAL_PATTERNS) {
      assert.equal(pattern.test(html), false, `${route} contains forbidden commercial marker ${pattern}`);
    }
  }
});

test('P0/P1 routes requiring 112 + 024 preserve official emergency access', async () => {
  const criticalRoutes = await readCriticalInventory();
  const suicideSupportRoutes = criticalRoutes.filter(({ invariant }) => /112\s*\+\s*024/i.test(invariant));

  assert.ok(suicideSupportRoutes.length > 0, 'inventory must identify routes requiring 112 + 024');

  for (const { route } of suicideSupportRoutes) {
    const file = routeToFile(route);
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /href=['\"]tel:112['\"]/i, `${route} must preserve 112 access`);
    assert.match(html, /href=['\"]tel:024['\"]/i, `${route} must preserve 024 access`);
    assert.match(html, /sanidad\.gob\.es\/linea024/i, `${route} must preserve the official Ministry of Health 024 source`);
  }
});
