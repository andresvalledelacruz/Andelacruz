import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSearchText } from '../src/search-normalization.js';
import { routeSearchQuery } from '../src/search-crisis-router.js';

test('normaliza variantes laborales de España y Latinoamérica sin inferir intención', () => {
  assert.equal(normalizeSearchText('curro'), 'trabajo');
  assert.equal(normalizeSearchText('laburo'), 'trabajo');
  assert.equal(normalizeSearchText('chamba'), 'trabajo');
});

test('enruta pérdida de empleo expresada con variante rioplatense', () => {
  const result = routeSearchQuery('He perdido mi laburo');
  assert.equal(result.matched, true);
  assert.equal(result.intent, 'job_loss');
  assert.equal(result.safety_level, 'P2');
});

test('enruta pérdida de empleo expresada con variante latinoamericana', () => {
  const result = routeSearchQuery('He perdido mi chamba');
  assert.equal(result.matched, true);
  assert.equal(result.intent, 'job_loss');
  assert.equal(result.safety_level, 'P2');
});

test('un error grave en lenguaje de autolesión sigue priorizando Safety-first', () => {
  const result = routeSearchQuery('me kiero matarmeee');
  assert.equal(result.matched, true);
  assert.equal(result.intent, 'active_self_harm');
  assert.equal(result.safety_level, 'P0');
  assert.equal(result.urgent, true);
  assert.equal(result.suppress_commercial_ui, true);
  assert.deepEqual(result.official_resources_spain, ['112', '024']);
});

for (const input of ['me quiero', 'mi pareja me', 'no puedo con', 'ayuda con']) {
  test(`frase incompleta ${JSON.stringify(input)} pide aclaración y no adivina`, () => {
    const result = routeSearchQuery(input);
    assert.equal(result.matched, false);
    assert.equal(result.needs_clarification, true);
    assert.equal(result.route, null);
    assert.equal(result.raw_query_retained, false);
  });
}
