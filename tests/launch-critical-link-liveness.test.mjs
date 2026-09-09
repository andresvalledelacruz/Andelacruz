import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCriticalRoutes, routeToFile } from '../scripts/lib/p0-p1-resource-policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://desgracias.es';
const supportingRoutes = ['/', '/buscar/', '/privacidad.html', '/404.html', '/como-revisamos.html'];

function fileForRoute(route) {
  return route === '/' ? 'index.html' : routeToFile(route);
}

function readRoute(route) {
  return fs.readFileSync(path.join(root, fileForRoute(route)), 'utf8');
}

function localRouteFromHref(href) {
  if (!href || href.startsWith('#') || /^(?:mailto|tel|sms):/i.test(href)) return null;
  try {
    const url = new URL(href, origin);
    return url.origin === origin ? decodeURIComponent(url.pathname) : null;
  } catch {
    return null;
  }
}

test('every internal link exposed by the canonical critical journey matrix resolves', async () => {
  const journeys = [...new Set([...(await readCriticalRoutes()), ...supportingRoutes])];
  let checked = 0;

  assert.ok(journeys.length >= 12, `critical journey matrix unexpectedly shrank to ${journeys.length}`);
  for (const source of journeys) {
    assert.equal(fs.existsSync(path.join(root, fileForRoute(source))), true, `${source} must be deployable`);
    const html = readRoute(source);
    for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
      const target = localRouteFromHref(match[1]);
      if (!target) continue;
      checked += 1;
      assert.equal(
        fs.existsSync(path.join(root, fileForRoute(target))),
        true,
        `${source} links to missing internal target ${target}`,
      );
    }
  }

  assert.ok(checked >= 70, `critical internal-link coverage unexpectedly shrank to ${checked}`);
});

test('homepage urgent-help and search runtime destinations remain local and deployable', () => {
  const entry = fs.readFileSync(path.join(root, 'search-home-entry.js'), 'utf8');
  assert.match(entry, /const SEARCH_URL = '\/buscar\/'/);
  assert.match(entry, /const URGENT_URL = '\/ayuda-urgente\.html'/);
  assert.equal(fs.existsSync(path.join(root, fileForRoute('/buscar/'))), true);
  assert.equal(fs.existsSync(path.join(root, fileForRoute('/ayuda-urgente.html'))), true);
  assert.doesNotMatch(entry, /const (?:SEARCH|URGENT)_URL = 'https?:\/\//i);
});
