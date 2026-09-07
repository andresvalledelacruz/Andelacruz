import test from 'node:test';
import assert from 'node:assert/strict';
import { routeSearchQuery, searchRoutingCapabilities } from '../src/search-crisis-router.js';

test('active suicidal crisis routes to urgent help and suppresses commerce', () => {
  const result = routeSearchQuery('Estoy pensando en quitarme la vida ahora mismo');
  assert.equal(result.matched, true);
  assert.equal(result.intent, 'active_self_harm');
  assert.equal(result.route.url, '/ayuda-urgente.html');
  assert.equal(result.safety_level, 'P0');
  assert.equal(result.urgent, true);
  assert.deepEqual(result.official_resources_spain, ['112', '024']);
  assert.equal(result.suppress_commercial_ui, true);
  assert.equal(result.raw_query_retained, false);
});

test('concern for another person is not confused with bereavement', () => {
  const result = routeSearchQuery('Mi hijo dice que no quiere vivir y estoy muy preocupado');
  assert.equal(result.intent, 'concern_for_someone');
  assert.equal(result.route.url, '/me-preocupa-que-alguien-pueda-suicidarse/');
  assert.equal(result.safety_level, 'P0');
});

test('suicide bereavement routes to postvention instead of active-crisis route', () => {
  const result = routeSearchQuery('Mi marido se suicidó hace dos semanas y no sé cómo seguir');
  assert.equal(result.intent, 'suicide_bereavement');
  assert.equal(result.route.url, '/duelo/ha-muerto-por-suicidio-alguien-que-quiero/');
  assert.equal(result.safety_level, 'P1');
  assert.equal(result.urgent, false);
  assert.equal(result.suppress_commercial_ui, true);
});

test('current first-person crisis overrides bereavement context', () => {
  const result = routeSearchQuery('Mi marido se suicidó y ahora yo quiero morir');
  assert.equal(result.intent, 'active_self_harm');
  assert.equal(result.route.url, '/ayuda-urgente.html');
  assert.equal(result.safety_level, 'P0');
});

test('limited typo tolerance recognises suicide bereavement', () => {
  const result = routeSearchQuery('Mi hermano murió por sucidio y estoy destrozado');
  assert.equal(result.intent, 'suicide_bereavement');
  assert.equal(result.route.url, '/duelo/ha-muerto-por-suicidio-alguien-que-quiero/');
});

test('negated current suicide language is not reinterpreted as active crisis', () => {
  const result = routeSearchQuery('No quiero suicidarme, necesito ayuda con cómo me siento');
  assert.equal(result.matched, false);
  assert.equal(result.needs_clarification, true);
  assert.equal(result.route, null);
});

test('negated death wish fallback does not trigger urgent routing', () => {
  const result = routeSearchQuery('No quiero morir, solo estoy muy asustado');
  assert.equal(result.matched, false);
  assert.equal(result.needs_clarification, true);
});

test('historical suicide context is not treated as a current crisis', () => {
  const result = routeSearchQuery('Intenté suicidarme hace diez años y ahora busco orientación');
  assert.equal(result.matched, false);
  assert.equal(result.needs_clarification, true);
});

test('informational suicide query is not treated as a personal crisis', () => {
  const result = routeSearchQuery('Busco estadísticas sobre el suicidio para un estudio');
  assert.equal(result.matched, false);
  assert.equal(result.needs_clarification, true);
});

test('a real active clause still wins after an earlier negated clause', () => {
  const result = routeSearchQuery('No quiero suicidarme, pero ahora estoy pensando en suicidarme');
  assert.equal(result.intent, 'active_self_harm');
  assert.equal(result.safety_level, 'P0');
  assert.equal(result.urgent, true);
});

test('negated third-party suicide language does not become a crisis automatically', () => {
  const result = routeSearchQuery('Mi hermano no quiere suicidarse, pero está triste');
  assert.equal(result.matched, false);
  assert.equal(result.needs_clarification, true);
});

test('high-risk violence routes suppress commercial UI', () => {
  const result = routeSearchQuery('Tengo miedo de mi pareja, mi pareja me maltrata');
  assert.equal(result.intent, 'intimate_partner_violence');
  assert.equal(result.route.url, '/mi-pareja-me-maltrata-y-no-se-que-hacer/');
  assert.equal(result.safety_level, 'P1');
  assert.equal(result.suppress_commercial_ui, true);
});

test('practical non-crisis needs can route without becoming a diagnosis', () => {
  const result = routeSearchQuery('Tengo muchas deudas y no sé por dónde empezar');
  assert.equal(result.intent, 'debt_overwhelm');
  assert.equal(result.route.url, '/dinero/tengo-deudas-y-no-se-por-donde-empezar/');
  assert.equal(result.safety_level, 'P2');
  assert.equal(result.diagnostic, false);
  assert.equal(result.automated_clinical_decision, false);
});

test('unknown wording asks for clarification rather than guessing', () => {
  const result = routeSearchQuery('No sé cómo llamarlo, solo sé que me pasa algo');
  assert.equal(result.matched, false);
  assert.equal(result.needs_clarification, true);
  assert.equal(result.route, null);
  assert.equal(result.raw_query_retained, false);
});

test('capabilities declare privacy and no public UI integration yet', () => {
  const capabilities = searchRoutingCapabilities();
  assert.equal(capabilities.safety_first, true);
  assert.equal(capabilities.retains_raw_query, false);
  assert.equal(capabilities.public_ui_integrated, false);
});
