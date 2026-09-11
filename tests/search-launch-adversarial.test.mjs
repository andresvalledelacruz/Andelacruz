import test from 'node:test';
import assert from 'node:assert/strict';
import { routeSearchQuery } from '../src/search-crisis-router.js';
import { routeKnownContentQuery } from '../src/search-content-catalog.js';

function routeLaunchQuery(query) {
  const safety = routeSearchQuery(query);
  if (safety.matched || safety.urgent_support) return { layer: 'safety', result: safety };
  return { layer: 'content', result: routeKnownContentQuery(query) };
}

const ordinaryCases = [
  ['me han echao del curro y no se q hacer', '/trabajo/me-han-despedido-y-no-se-que-hacer/'],
  ['no llego ni al dia 20 con lo que cobro', '/dinero/no-llego-a-fin-de-mes/'],
  ['mi ex me ha bloqueao de todos lados', '/rupturas/mi-ex-me-ha-bloqueado/'],
  ['no tengo a nadie con quien hablar', '/soledad/no-tengo-con-quien-hablar/']
];

for (const [query, expectedUrl] of ordinaryCases) {
  test(`launch search understands colloquial wording: ${query}`, () => {
    const { result } = routeLaunchQuery(query);
    assert.equal(result.matched, true, query);
    assert.equal(result.route?.url, expectedUrl, query);
    assert.equal(result.raw_query_retained, false, query);
  });
}

test('direct first-person suicidal language remains P0 despite conversational filler', () => {
  const result = routeSearchQuery('yo ya no quiero seguir viviendo, de verdad');
  assert.equal(result.intent, 'active_self_harm');
  assert.equal(result.safety_level, 'P0');
  assert.equal(result.urgent, true);
  assert.deepEqual(result.official_resources_spain, ['112', '024']);
  assert.equal(result.suppress_commercial_ui, true);
});

test('colloquial concern for another person remains P0', () => {
  const result = routeSearchQuery('mi hermano dice q se va a matar');
  assert.equal(result.intent, 'concern_for_someone');
  assert.equal(result.safety_level, 'P0');
  assert.equal(result.urgent, true);
  assert.deepEqual(result.official_resources_spain, ['112', '024']);
});

test('active partner violence with everyday relationship wording remains P0', () => {
  const result = routeSearchQuery('mi novio me esta pegando ahora mismo');
  assert.equal(result.intent, 'intimate_partner_violence');
  assert.equal(result.safety_level, 'P0');
  assert.equal(result.urgent, true);
  assert.deepEqual(result.official_resources_spain, ['112', '016']);
});

test('active sexual violence wording remains P0', () => {
  const result = routeSearchQuery('me estan agrediendo sexualmente ahora');
  assert.equal(result.intent, 'sexual_violence');
  assert.equal(result.safety_level, 'P0');
  assert.equal(result.urgent, true);
  assert.deepEqual(result.official_resources_spain, ['112', '016']);
});

test('resolved historical self-harm context is not relabelled as an active crisis', () => {
  const result = routeSearchQuery('hace años pense en suicidarme pero ahora estoy bien');
  assert.notEqual(result.safety_level, 'P0');
  assert.notEqual(result.intent, 'active_self_harm');
  assert.equal(result.raw_query_retained, false);
});

test('an earlier quoted suicide mention cannot hide a later real active disclosure', () => {
  const result = routeSearchQuery('lei una frase que decia quiero morir, pero ahora yo si quiero suicidarme');
  assert.equal(result.intent, 'active_self_harm');
  assert.equal(result.safety_level, 'P0');
  assert.equal(result.urgent, true);
});

test('negated present danger does not become an emergency', () => {
  const result = routeSearchQuery('no estoy en peligro ahora, solo necesito orientacion');
  assert.notEqual(result.safety_level, 'P0');
  assert.equal(result.matched, false);
  assert.equal(result.needs_clarification, true);
});

test('ambiguous disappearance wording is clarified rather than labelled as suicide', () => {
  const result = routeSearchQuery('quiero desaparecer y no se ni como explicar lo que me pasa');
  assert.notEqual(result.intent, 'active_self_harm');
  assert.notEqual(result.safety_level, 'P0');
  assert.equal(result.matched, false);
  assert.equal(result.needs_clarification, true);
});

test('metaphorical drowning wording is not treated as literal immediate danger', () => {
  const result = routeSearchQuery('me estoy ahogando con todo y no se por donde empezar');
  assert.notEqual(result.intent, 'immediate_danger');
  assert.notEqual(result.safety_level, 'P0');
  assert.equal(result.raw_query_retained, false);
});
