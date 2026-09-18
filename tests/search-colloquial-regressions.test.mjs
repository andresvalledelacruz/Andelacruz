import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { normalizeSearchText } from '../src/search-normalization.js';
import { routeSearchQuery, searchRouteCatalog } from '../src/search-crisis-router.js';
import { routeKnownContentQuery, searchContentCatalog } from '../src/search-content-catalog.js';

const route = (query) => {
  const safety = routeSearchQuery(query);
  return safety.matched || safety.urgent_support?.available ? safety : routeKnownContentQuery(query);
};

for (const [query, intent] of [
  ['me han echado del currelo', 'job_loss'],
  ['me han despedío', 'job_loss'],
  ['no aguanto más currando', 'work_overload'],
  ['no tengo coleguis', 'no_friends'],
  ['no tengo hamigos', 'no_friends'],
  ['no tengo amiwos', 'no_friends'],
  ['no puedo pagar la ipoteca', 'housing_payment'],
  ['no puedo pagar la hipteca', 'housing_payment'],
  ['mi curriculun no funciona', 'cv_problem'],
  ['mi curriclum no funciona', 'cv_problem']
]) test(`curated colloquial/typo route: ${query}`, () => {
  assert.equal(route(query).intent, intent);
});

for (const [query, expected] of [
  ['mi hija quiere sucidarse', 'concern_for_someone'],
  ['mi hermano se suisidó', 'suicide_bereavement'],
  ['quiero suisidarme y no puedo pagar la ipoteca', 'active_self_harm'],
  ['he sufrido una agreison sexual', 'sexual_violence']
]) test(`safety precedes ordinary matching: ${query}`, () => {
  const result = route(query);
  assert.equal(result.intent, expected);
  assert.equal(result.suppress_commercial_ui, true);
  assert.equal(result.raw_query_retained, false);
  assert.equal(JSON.stringify(result).includes(query), false);
});

for (const query of ['no quiero suisidarme', 'mi hija no quiere sucidarse', 'suisidio', 'tengo deudas y suisidio']) {
  test(`negated or uncertain input asks for clarification: ${query}`, () => {
    const result = routeSearchQuery(query);
    assert.equal(result.matched, false);
    assert.equal(result.needs_clarification, true);
    assert.equal(result.safety_level, 'NONE');
  });
}

test('negation survives normalization and a separate active clause still wins', () => {
  assert.equal(normalizeSearchText('NO quiero suisidarme'), 'no quiero suicidarme');
  assert.equal(route('no quiero suisidarme pero ahora quiero matarme').safety_level, 'P0');
});

test('ambiguous regional words are not assigned an invented meaning', () => {
  for (const query of ['menuda faena', 'estoy fatal', 'vaya tela', 'qué palo', 'estoy chungo']) {
    assert.equal(normalizeSearchText(query), query.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    assert.equal(route(query).needs_clarification, true);
  }
});

test('all catalog destinations have a published guide file', () => {
  for (const entry of [...searchRouteCatalog(), ...searchContentCatalog()]) {
    const relative = entry.url.endsWith('/') ? `${entry.url}index.html` : entry.url;
    assert.ok(existsSync(new URL(`..${relative}`, import.meta.url)), entry.url);
  }
});
