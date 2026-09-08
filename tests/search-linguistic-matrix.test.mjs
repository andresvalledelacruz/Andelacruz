import test from 'node:test';
import assert from 'node:assert/strict';
import { routeSearchQuery } from '../src/search-crisis-router.js';

const routedCases = [
  ['Me quiero morir', 'active_self_harm', 'P0', true],
  ['No puedo seguir viviendo', 'active_self_harm', 'P0', true],
  ['Me voy a matar', 'active_self_harm', 'P0', true],
  ['Estoy pensando en matarme ahora', 'active_self_harm', 'P0', true],
  ['Voy a quitarme la vida esta noche', 'active_self_harm', 'P0', true],
  ['Tengo deudas y ahora quiero morir', 'active_self_harm', 'P0', true],
  ['Me han despedido y no quiero vivir', 'active_self_harm', 'P0', true],
  ['Mi hija dice que no quiere vivir', 'concern_for_someone', 'P0', true],
  ['Mi hermano dice que se va a matar', 'concern_for_someone', 'P0', true],
  ['Me preocupa que mi pareja pueda suicidarse', 'concern_for_someone', 'P0', true],
  ['Mi padre se suicidó y estoy destrozado', 'suicide_bereavement', 'P1', false],
  ['Se me ha muerto un familiar por suicidio', 'suicide_bereavement', 'P1', false],
  ['Mi hermano murió por sucidio', 'suicide_bereavement', 'P1', false],
  ['Mi hermano ha intentado suicidarse', 'post_attempt_support', 'P0', true],
  ['Estoy en peligro inmediato', 'immediate_danger', 'P0', true],
  ['Mi pareja me está pegando', 'intimate_partner_violence', 'P0', true],
  ['Me están violando', 'sexual_violence', 'P0', true],
  ['Mi pareja me pega y tengo miedo', 'intimate_partner_violence', 'P1', false],
  ['Tengo miedo de mi pareja porque me controla', 'intimate_partner_violence', 'P1', false],
  ['He sufrido una agresión sexual', 'sexual_violence', 'P1', false],
  ['Me han violado y no sé qué hacer', 'sexual_violence', 'P1', false],
  ['Tengo muchas deudas y no sé por dónde empezar', 'debt_overwhelm', 'P1', false],
  ['No puedo pagar mis deudas', 'debt_overwhelm', 'P1', false],
  ['Me han despedido y no sé qué hacer', 'job_loss', 'P2', false],
  ['He perdido mi trabajo', 'job_loss', 'P2', false],
  ['Necesito encontrar trabajo cuanto antes', 'urgent_job_search', 'P3', false],
  ['Busco trabajo urgente', 'urgent_job_search', 'P3', false],
  ['No tengo con quién hablar', 'loneliness', 'P2', false],
  ['Me siento muy sola', 'loneliness', 'P2', false]
];

for (const [input, intent, safetyLevel, urgent] of routedCases) {
  test(`routes ${JSON.stringify(input)} to ${intent}`, () => {
    const result = routeSearchQuery(input);
    assert.equal(result.matched, true);
    assert.equal(result.intent, intent);
    assert.equal(result.safety_level, safetyLevel);
    assert.equal(result.urgent, urgent);
    assert.equal(result.raw_query_retained, false);
    assert.equal(result.diagnostic, false);
    assert.equal(result.automated_clinical_decision, false);
    if (safetyLevel === 'P0' || safetyLevel === 'P1') {
      assert.equal(result.suppress_commercial_ui, true);
    }
  });
}

const clarificationCases = [
  'Suicidio',
  'No quiero suicidarme, pero necesito ayuda',
  'Ya no quiero morir, necesito orientación',
  'Mi hermano no quiere suicidarse',
  'Intenté suicidarme hace diez años',
  'Busco estadísticas sobre el suicidio',
  'Es para un trabajo sobre prevención del suicidio',
  'No sé cómo llamarlo, solo sé que algo va mal',
  '',
  'Necesito ayuda'
];

for (const input of clarificationCases) {
  test(`asks for clarification instead of guessing for ${JSON.stringify(input)}`, () => {
    const result = routeSearchQuery(input);
    assert.equal(result.matched, false);
    assert.equal(result.needs_clarification, true);
    assert.equal(result.route, null);
    assert.equal(result.raw_query_retained, false);
  });
}

test('current crisis wins over bereavement and practical context', () => {
  const result = routeSearchQuery('Mi marido se suicidó, tengo deudas y ahora quiero morir');
  assert.equal(result.intent, 'active_self_harm');
  assert.equal(result.safety_level, 'P0');
  assert.equal(result.urgent, true);
});

test('active clause wins after an explicit earlier negation', () => {
  const result = routeSearchQuery('No quiero suicidarme, pero ahora estoy pensando en suicidarme');
  assert.equal(result.intent, 'active_self_harm');
  assert.equal(result.safety_level, 'P0');
});

test('P0 routes retain official Spain resources', () => {
  const self = routeSearchQuery('Voy a quitarme la vida esta noche');
  const other = routeSearchQuery('Mi hija dice que no quiere vivir');
  assert.deepEqual(self.official_resources_spain, ['112', '024']);
  assert.deepEqual(other.official_resources_spain, ['112', '024']);
});
