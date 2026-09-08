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

test('eight suicide contexts stay distinct and uncertainty offers help without a crisis label', () => {
  const cases = [
    ['No quiero seguir viviendo', 'active_self_harm'],
    ['Temo que mi amigo podría suicidarse', 'concern_for_someone'],
    ['Se suicidó mi hermano', 'suicide_bereavement'],
    ['No quiero suicidarme', 'negated_current'],
    ['Hace años quería morir, pero ahora estoy bien', 'resolved_past'],
    ['¿Qué hago si quiero morir?', 'hypothetical'],
    ['Un artículo cita la frase quiero morir', 'informational'],
    ['Suicidio', 'ambiguous']
  ];

  for (const [query, expected] of cases) {
    const result = routeSearchQuery(query);
    assert.equal(result.intent ?? result.context, expected, query);
  }

  for (const query of ['¿Qué hago si quiero morir?', 'Suicidio']) {
    const result = routeSearchQuery(query);
    assert.equal(result.matched, false);
    assert.equal(result.safety_level, 'NONE');
    assert.equal(result.urgent_support.url, '/ayuda-urgente.html');
    assert.equal(result.show_relevant_results, true);
  }
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

test('a separate active crisis wins over informational or resolved context', () => {
  for (const query of [
    'Un artículo cita quiero morir, pero yo quiero morir ahora',
    'Antes quería morir y ahora estoy bien; hoy quiero suicidarme',
    'Un artículo habla de suicidio. Ahora me voy a matar'
  ]) {
    const result = routeSearchQuery(query);
    assert.equal(result.intent, 'active_self_harm', query);
    assert.equal(result.safety_level, 'P0', query);
    assert.equal(result.urgent, true, query);
  }
});

test('recent attempt by someone close routes to pertinent aftercare support', () => {
  const result = routeSearchQuery('Mi hermano ha intentado suicidarse');
  assert.equal(result.intent, 'post_attempt_support');
  assert.equal(result.route.url, '/alguien-cercano-ha-intentado-suicidarse/');
  assert.equal(result.safety_level, 'P0');
  assert.equal(result.urgent, true);
  assert.deepEqual(result.official_resources_spain, ['112', '024']);
});

test('negated or resolved historical attempt by someone close is not labeled active', () => {
  const negated = routeSearchQuery('Mi hermano no ha intentado suicidarse');
  assert.equal(negated.matched, false);

  const historical = routeSearchQuery('Mi hermano intentó suicidarse hace diez años y ahora está bien');
  assert.equal(historical.intent, 'post_attempt_support');
  assert.equal(historical.safety_level, 'P1');
  assert.equal(historical.urgent, false);
  assert.deepEqual(historical.official_resources_spain, []);

  for (const query of [
    'Mi hermano intentó suicidarse hace veinte años y ahora está bien',
    'Mi hermano intentó suicidarse hace 8 años y ahora está bien',
    'Mi hermano intentó suicidarse hace meses y ahora está bien'
  ]) {
    const result = routeSearchQuery(query);
    assert.equal(result.safety_level, 'P1', query);
    assert.equal(result.urgent, false, query);
  }
});

test('generic immediate danger receives urgent help without a suicide label', () => {
  const result = routeSearchQuery('Estoy en peligro inmediato');
  assert.equal(result.intent, 'immediate_danger');
  assert.equal(result.route.url, '/ayuda-urgente.html');
  assert.equal(result.safety_level, 'P0');
  assert.equal(result.urgent, true);
  assert.deepEqual(result.official_resources_spain, ['112']);
});

test('contextual suicide wording cannot hide a separate immediate danger', () => {
  const result = routeSearchQuery('No quiero suicidarme, pero estoy en peligro inmediato');
  assert.equal(result.intent, 'immediate_danger');
  assert.equal(result.safety_level, 'P0');
  assert.deepEqual(result.official_resources_spain, ['112']);
});

test('context-specific active violence wins over generic danger resources', () => {
  const result = routeSearchQuery('Estoy en peligro inmediato con mi pareja, me está pegando');
  assert.equal(result.intent, 'intimate_partner_violence');
  assert.equal(result.safety_level, 'P0');
  assert.deepEqual(result.official_resources_spain, ['112', '016']);
});

test('negated immediate danger is not promoted to P0', () => {
  const result = routeSearchQuery('No estoy en peligro inmediato, busco información');
  assert.equal(result.matched, false);
  assert.equal(result.needs_clarification, true);
});

test('an urgent practical request is not mislabeled as immediate danger', () => {
  const result = routeSearchQuery('Necesito ayuda urgente con mi currículum');
  assert.notEqual(result.intent, 'immediate_danger');
  assert.notEqual(result.safety_level, 'P0');
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

test('active violence is P0 and preserves 112 and 016', () => {
  for (const query of ['Mi pareja me está pegando', 'Mi marido me va a matar', 'Me están violando']) {
    const result = routeSearchQuery(query);
    assert.equal(result.safety_level, 'P0', query);
    assert.equal(result.urgent, true, query);
    assert.deepEqual(result.official_resources_spain, ['112', '016'], query);
    assert.equal(result.suppress_commercial_ui, true, query);
  }
});

test('negated and fictional violence mentions do not trigger emergency routing', () => {
  for (const query of [
    'No es cierto que mi pareja me pega ahora',
    'No me están violando',
    'No me está agrediendo sexualmente',
    'Ya no me está pegando mi pareja',
    'No estoy en peligro con mi pareja',
    'En una película me están violando',
    'Supongamos que me están violando',
    'Una actriz dice: me están violando',
    'Estoy en peligro inmediato en un videojuego',
    'No es verdad que estoy en peligro inmediato'
  ]) {
    const result = routeSearchQuery(query);
    assert.equal(result.matched, false, query);
    assert.equal(result.needs_clarification, true, query);
  }
});

test('fictional context cannot hide a later real violence disclosure', () => {
  for (const query of [
    'En una película me están violando; pero en realidad mi pareja me pega ahora',
    'Una actriz dice me están violando; pero mi marido me va a matar',
    'Supongamos que mi pareja me pega ahora, pero en realidad me está pegando'
  ]) {
    const result = routeSearchQuery(query);
    assert.equal(result.matched, true, query);
    assert.equal(result.safety_level, 'P0', query);
    assert.equal(result.urgent, true, query);
    assert.deepEqual(result.official_resources_spain, ['112', '016'], query);
  }
});

test('practical non-crisis needs can route without becoming a diagnosis', () => {
  const result = routeSearchQuery('Tengo muchas deudas y no sé por dónde empezar');
  assert.equal(result.intent, 'debt_overwhelm');
  assert.equal(result.route.url, '/dinero/tengo-deudas-y-no-se-por-donde-empezar/');
  assert.equal(result.safety_level, 'P1');
  assert.equal(result.suppress_commercial_ui, true);
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
