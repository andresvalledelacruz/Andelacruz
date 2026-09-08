import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { routeKnownContentQuery, searchContentCatalog } from '../src/search-content-catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function targetExists(url) {
  if (!url.startsWith('/') || url === '/') return false;
  const relative = url.replace(/^\//, '');
  return url.endsWith('/')
    ? fs.existsSync(path.join(root, relative, 'index.html'))
    : fs.existsSync(path.join(root, relative));
}

test('launch catalog covers a broad set of existing non-Safety situations', () => {
  const catalog = searchContentCatalog();
  assert.ok(catalog.length >= 35, `expected at least 35 content intents, got ${catalog.length}`);
  assert.equal(new Set(catalog.map((item) => item.intent)).size, catalog.length);
  assert.equal(new Set(catalog.map((item) => item.url)).size, catalog.length);
});

test('every catalog destination exists and is local', () => {
  for (const item of searchContentCatalog()) {
    assert.equal(targetExists(item.url), true, `missing target for ${item.intent}: ${item.url}`);
    assert.ok(item.label.length >= 4);
  }
});

test('routes representative everyday wording across launch domains', () => {
  const cases = [
    ['mi ex me ha bloqueado de todas partes', '/rupturas/mi-ex-me-ha-bloqueado/'],
    ['por la noche me siento sola', '/soledad/me-siento-solo-por-la-noche/'],
    ['mi madre ha dejado de hablarme', '/familia/mi-madre-o-mi-padre-no-me-habla/'],
    ['mi jefe me tiene amargado', '/trabajo/mi-jefe-me-hace-la-vida-imposible/'],
    ['me da miedo abrir la app del banco', '/dinero/me-da-miedo-mirar-mi-cuenta/'],
    ['murio y no pude despedirme', '/duelo/no-pude-despedirme/']
  ];

  for (const [query, expected] of cases) {
    const result = routeKnownContentQuery(query);
    assert.equal(result.matched, true, query);
    assert.equal(result.route.url, expected, query);
    assert.equal(result.raw_query_retained, false, query);
    assert.equal(result.diagnostic, false, query);
  }
});

test('Safety-like language is never claimed by the ordinary content catalog', () => {
  const cases = [
    'quiero morir porque me han despedido',
    'mi pareja me esta pegando ahora',
    'me estan violando',
    'estoy en peligro inmediato',
    'he tomado una sobredosis'
  ];

  for (const query of cases) {
    const result = routeKnownContentQuery(query);
    assert.equal(result.matched, false, query);
    assert.equal(result.needs_safety_router, true, query);
    assert.equal(result.raw_query_retained, false, query);
  }
});

test('unknown and empty wording ask for clarification without retention', () => {
  for (const query of ['', 'no se muy bien que me pasa']) {
    const result = routeKnownContentQuery(query);
    assert.equal(result.matched, false);
    assert.equal(result.needs_clarification, true);
    assert.equal(result.raw_query_retained, false);
  }
});
