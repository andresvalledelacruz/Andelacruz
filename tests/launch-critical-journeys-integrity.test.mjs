import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://desgracias.es';

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function routeToFile(route) {
  if (route === '/') return 'index.html';
  if (route.endsWith('/')) return `${route.slice(1)}index.html`;
  return route.slice(1);
}

function canonicalOf(html) {
  const matches = [...html.matchAll(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/gi)];
  assert.equal(matches.length, 1, 'each launch target must expose exactly one canonical');
  return matches[0][1];
}

const indexedJourneys = [
  '/ayuda-urgente.html',
  '/me-preocupa-que-alguien-pueda-suicidarse/',
  '/mi-pareja-me-maltrata-y-no-se-que-hacer/',
  '/he-sufrido-una-agresion-sexual-y-no-se-que-hacer/',
  '/dinero/tengo-deudas-y-no-se-por-donde-empezar/',
  '/rupturas/mi-ex-me-ha-bloqueado/',
  '/soledad/me-siento-solo-por-la-noche/',
  '/familia/mi-madre-o-mi-padre-no-me-habla/',
  '/trabajo/mi-jefe-me-hace-la-vida-imposible/',
  '/dinero/me-da-miedo-mirar-mi-cuenta/',
  '/duelo/no-pude-despedirme/'
];

test('launch D5 keeps critical journeys physically present, canonical and discoverable', () => {
  const sitemap = read('sitemap.xml');
  const sitemapLocs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));

  for (const route of indexedJourneys) {
    const relative = routeToFile(route);
    assert.equal(fs.existsSync(path.join(root, relative)), true, `${route} must resolve to ${relative}`);
    const html = read(relative);
    const expectedCanonical = `${origin}${route}`;
    assert.equal(canonicalOf(html), expectedCanonical, `${route} canonical must match its public URL`);
    assert.equal(sitemapLocs.has(expectedCanonical), true, `${route} must be present in sitemap.xml`);
  }
});

test('launch D5 keeps private search out of sitemap and explicitly noindex', () => {
  const search = read('buscar/index.html');
  const sitemap = read('sitemap.xml');
  assert.match(search, /<meta\s+[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i);
  assert.equal(sitemap.includes(`${origin}/buscar/`), false, '/buscar/ must remain outside sitemap while noindex');
});

test('launch D5 keeps robots, sitemap and 404 recovery mutually coherent', () => {
  const robots = read('robots.txt');
  const notFound = read('404.html');
  assert.match(robots, /^User-agent:\s*\*$/m);
  assert.match(robots, /^Allow:\s*\/$/m);
  assert.match(robots, /^Sitemap:\s*https:\/\/desgracias\.es\/sitemap\.xml$/m);
  for (const route of indexedJourneys) {
    assert.equal(robots.includes(`Disallow: ${route}`), false, `${route} must not be blocked by robots.txt`);
  }
  assert.match(notFound, /name=["']robots["'][^>]*noindex|noindex[^>]*name=["']robots["']/i);
  assert.match(notFound, /href=["']\/["']/i);
});
