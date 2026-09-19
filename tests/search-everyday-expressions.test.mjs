import test from 'node:test';
import assert from 'node:assert/strict';
import { routeSearchQuery } from '../src/search-crisis-router.js';
import { routeKnownContentQuery } from '../src/search-content-catalog.js';

function route(query) {
  const safety = routeSearchQuery(query);
  return safety.matched || safety.urgent_support?.available ? safety : routeKnownContentQuery(query);
}

for (const [query, intent] of [
  ['voy hasta arriba en el curro', 'work_overload'],
  ['estoy hasta arriba de trabajo', 'work_overload'],
  ['me llevo el curro a casa', 'work_disconnect'],
  ['no paro de darle vueltas al curro', 'work_disconnect'],
  ['echo curriculums y no me llama nadie', 'cv_problem'],
  ['he echado curriculums y no me llaman', 'cv_problem'],
  ['se me va el sueldo en recibos', 'ends_meet'],
  ['no me da el sueldo para pasar el mes', 'ends_meet'],
  ['no me da para pagar el alquiler', 'housing_payment'],
  ['no me llega para pagar la hipoteca', 'housing_payment'],
  ['no tengo con quién quedar', 'no_friends'],
  ['me he quedado sin nadie con quien hablar', 'no_one_to_talk']
]) test(`everyday expression: ${query}`, () => {
  const result = route(query);
  assert.equal(result.intent, intent);
  if (intent === 'no_one_to_talk') assert.equal(result.route.url, '/soledad/no-tengo-con-quien-hablar/');
  assert.equal(result.raw_query_retained, false);
  assert.equal(JSON.stringify(result).includes(query), false);
});

test('ordinary catalog distinguishes needing someone to talk to from having no friends', () => {
  for (const query of ['no tengo con quién hablar', 'no tengo a nadie con quien hablar']) {
    const result = routeKnownContentQuery(query);
    assert.equal(result.intent, 'no_one_to_talk');
    assert.equal(result.route.url, '/soledad/no-tengo-con-quien-hablar/');
    // Existing first-stage routing remains authoritative for these two phrases.
    assert.equal(route(query).intent, 'loneliness');
  }
});

test('new expressions do not override an explicit emergency', () => {
  const result = route('quiero matarme y se me va el sueldo en recibos');
  assert.equal(result.safety_level, 'P0');
  assert.equal(result.suppress_commercial_ui, true);
});

test('isolated slang and negated new expressions do not acquire a new meaning', () => {
  for (const query of ['voy hasta arriba', 'menudo palo', 'estoy chungo', 'no me llevo el curro a casa', 'sí tengo con quién quedar']) {
    assert.equal(routeKnownContentQuery(query).needs_clarification, true, query);
  }
});
