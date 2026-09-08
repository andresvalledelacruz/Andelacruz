import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { routeSearchQuery } from '../src/search-crisis-router.js';
import { routeKnownContentQuery } from '../src/search-content-catalog.js';

const ui = fs.readFileSync(new URL('../buscar/index.html', import.meta.url), 'utf8');

test('public search invokes Safety router before ordinary content fallback', () => {
  const safetyCall = ui.indexOf('routeSearchQuery(submittedQuery)');
  const contentCall = ui.indexOf('routeKnownContentQuery(submittedQuery)');
  assert.ok(safetyCall >= 0);
  assert.ok(contentCall > safetyCall);
  assert.match(ui, /if \(!routed\.matched && !routed\.urgent_support\?\.available\)/);
  assert.match(ui, /if \(contentRouted\.matched\) routed = contentRouted/);
});

test('critical and urgent routing wins even when ordinary content also matches', () => {
  const cases = [
    ['quiero morir porque mi jefe me trata fatal', 'P0'],
    ['mi pareja me esta pegando ahora y no llego a fin de mes', 'P0'],
    ['me estan agrediendo sexualmente y tengo problemas de dinero', 'P0']
  ];

  for (const [query, expectedLevel] of cases) {
    const safety = routeSearchQuery(query);
    assert.equal(safety.matched, true, query);
    assert.equal(safety.safety_level, expectedLevel, query);
    const ordinary = routeKnownContentQuery(query);
    assert.equal(ordinary.matched, false, query);
    assert.equal(ordinary.needs_safety_router, true, query);
  }
});

test('ordinary catalog expands previously unmatched useful searches', () => {
  const cases = [
    ['mi jefe me tiene amargado', '/trabajo/mi-jefe-me-hace-la-vida-imposible/'],
    ['me da miedo abrir la app del banco', '/dinero/me-da-miedo-mirar-mi-cuenta/'],
    ['murio y no pude despedirme', '/duelo/no-pude-despedirme/']
  ];

  for (const [query, target] of cases) {
    const safety = routeSearchQuery(query);
    if (safety.matched) continue;
    const ordinary = routeKnownContentQuery(query);
    assert.equal(ordinary.matched, true, query);
    assert.equal(ordinary.route.url, target, query);
  }
});

test('search still clears the textarea before routing and does not retain raw text', () => {
  const capture = ui.indexOf('const submittedQuery = query.value.trim();');
  const clear = ui.indexOf("query.value = '';", capture);
  const route = ui.indexOf('routeSearchQuery(submittedQuery)', capture);
  assert.ok(capture >= 0 && clear > capture && route > clear);
  assert.doesNotMatch(ui, /localStorage|sessionStorage|indexedDB|sendBeacon|XMLHttpRequest/);
});
