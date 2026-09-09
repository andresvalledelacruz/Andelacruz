import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCriticalRoutes, routeToFile } from '../scripts/lib/p0-p1-resource-policy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://desgracias.es';
const supportingRoutes = [
  '/',
  '/buscar/',
  '/privacidad.html',
  '/404.html',
  '/como-revisamos.html',
];

function fileForRoute(route) {
  return route === '/' ? 'index.html' : routeToFile(route);
}

function readRoute(route) {
  return fs.readFileSync(path.join(root, fileForRoute(route)), 'utf8');
}

function tags(html, name) {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) ?? [];
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'))?.[1] ?? null;
}

function canonical(html) {
  const tag = tags(html, 'link').find((candidate) => attribute(candidate, 'rel')?.toLowerCase() === 'canonical');
  return tag ? attribute(tag, 'href') : null;
}

function robots(html) {
  const tag = tags(html, 'meta').find((candidate) => attribute(candidate, 'name')?.toLowerCase() === 'robots');
  return tag ? (attribute(tag, 'content') ?? '').toLowerCase() : '';
}

function localRouteFromHref(href) {
  if (!href || href.startsWith('#') || /^(?:mailto|tel|sms):/i.test(href)) return null;
  let url;
  try {
    url = new URL(href, origin);
  } catch {
    return null;
  }
  if (url.origin !== origin) return null;
  return decodeURIComponent(url.pathname);
}

test('release candidate governs at least twelve distinct critical journeys from one Safety inventory', async () => {
  const safetyRoutes = await readCriticalRoutes();
  const journeys = [...new Set([...safetyRoutes, ...supportingRoutes])];

  assert.ok(safetyRoutes.length >= 7, 'P0/P1 inventory unexpectedly shrank');
  assert.ok(journeys.length >= 12, `expected at least 12 critical journeys, found ${journeys.length}`);
  for (const required of ['/ayuda-urgente.html', '/buscar/', '/404.html', '/privacidad.html']) {
    assert.ok(journeys.includes(required), `${required} must remain in the release journey matrix`);
  }

  for (const route of journeys) {
    const file = fileForRoute(route);
    assert.ok(fs.existsSync(path.join(root, file)), `${route} must resolve to ${file}`);
  }
});

test('critical journeys keep exact canonical and indexability contracts', async () => {
  const journeys = [...new Set([...(await readCriticalRoutes()), ...supportingRoutes])];

  for (const route of journeys) {
    const html = readRoute(route);
    const policy = robots(html);

    if (route === '/404.html') {
      assert.match(policy, /(?:^|,)\s*noindex(?:,|$)/, '404 must remain noindex');
      continue;
    }

    assert.equal(canonical(html), `${origin}${route}`, `${route} canonical drifted`);
    if (route === '/buscar/') {
      assert.match(policy, /(?:^|,)\s*noindex(?:,|$)/, 'controlled-launch search must remain noindex');
    } else {
      assert.match(policy, /(?:^|,)\s*index(?:,|$)/, `${route} must remain indexable`);
      assert.doesNotMatch(policy, /noindex/, `${route} cannot be both index and noindex`);
    }
  }
});

test('every internal link exposed by a critical journey resolves to a deployable file', async () => {
  const journeys = [...new Set([...(await readCriticalRoutes()), ...supportingRoutes])];
  let checked = 0;

  for (const source of journeys) {
    const html = readRoute(source);
    for (const tag of tags(html, 'a')) {
      const target = localRouteFromHref(attribute(tag, 'href'));
      if (!target) continue;
      const file = fileForRoute(target);
      checked += 1;
      assert.ok(fs.existsSync(path.join(root, file)), `${source} links to missing ${target} -> ${file}`);
    }
  }

  assert.ok(checked >= 70, `critical-link coverage unexpectedly shrank to ${checked}`);
});

test('homepage runtime destinations for urgent help and search remain local and deployable', () => {
  const entry = fs.readFileSync(path.join(root, 'search-home-entry.js'), 'utf8');
  assert.match(entry, /const SEARCH_URL = '\/buscar\/'/);
  assert.match(entry, /const URGENT_URL = '\/ayuda-urgente\.html'/);
  assert.ok(fs.existsSync(path.join(root, fileForRoute('/buscar/'))));
  assert.ok(fs.existsSync(path.join(root, fileForRoute('/ayuda-urgente.html'))));
  assert.doesNotMatch(entry, /const (?:SEARCH|URGENT)_URL = 'https?:\/\//i);
});
