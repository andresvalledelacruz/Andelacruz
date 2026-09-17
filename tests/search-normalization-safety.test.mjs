import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSearchText } from '../src/search-normalization.js';
import { routeSearchQuery } from '../src/search-crisis-router.js';
import { routeKnownContentQuery } from '../src/search-content-catalog.js';

for (const [query, intent] of [
  ['NO PUEDO PAGAR EL ALKILER!!!', 'housing_payment'],
  ['no me da la pasta para el alquiler', 'housing_payment'],
  ['estoy sin un duro', 'ends_meet'],
  ['mi pareja ha cortado conmigo', 'breakup'],
  ['no consigo desconectar del travajo', 'work_disconnect']
]) test(`bounded everyday vocabulary: ${query}`, () => {
  assert.equal(routeKnownContentQuery(query).intent, intent);
});

test('colloquial job loss and typo are understood', () => {
  assert.equal(routeSearchQuery('me han echado del curro').intent, 'job_loss');
  assert.equal(routeSearchQuery('me han despidido').intent, 'job_loss');
});

test('corrected crisis spelling takes priority over ordinary problems', () => {
  const query = 'quiero sucidarme y no puedo pagar el alkiler';
  const result = routeSearchQuery(query);
  assert.equal(result.safety_level, 'P0');
  assert.equal(routeKnownContentQuery(query).needs_safety_router, true);
  assert.equal(JSON.stringify(result).includes(query), false);
  assert.equal(result.raw_query_retained, false);
});

test('correction preserves negation instead of declaring an active crisis', () => {
  const result = routeSearchQuery('no quiero sucidarme');
  assert.equal(result.matched, false);
  assert.equal(result.context, 'negated_current');
  assert.equal(result.needs_clarification, true);
  assert.equal(normalizeSearchText('NO quiero'), 'no quiero');
});

test('ambiguous safety context cannot be swallowed by debts or employment', () => {
  for (const query of ['suicidio y tengo deudas', 'suicidio y necesito empleo']) {
    const result = routeSearchQuery(query);
    assert.equal(result.matched, false);
    assert.equal(result.needs_clarification, true);
    assert.equal(result.urgent_support.available, true);
  }
});

test('unknown language asks instead of fuzzy guessing', () => {
  assert.equal(routeKnownContentQuery('algo va regular y no lo entiendo').needs_clarification, true);
});
