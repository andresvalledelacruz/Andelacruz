import test from 'node:test';
import assert from 'node:assert/strict';
import { classifySuicideContext } from '../src/suicide-context-classifier.js';

const cases = [
  ['Estoy pensando en suicidarme ahora mismo', 'active_self', true],
  ['Voy a quitarme la vida esta noche', 'active_self', true],
  ['Mi hijo dice que quiere suicidarse hoy', 'active_third_party', true],
  ['Creo que mi hermana puede suicidarse', 'active_third_party', true],
  ['Mi marido se suicidó el año pasado', 'bereavement', false],
  ['Se me ha muerto un familiar por suicidio', 'bereavement', false],
  ['No quiero suicidarme, necesito dejar de sentirme así', 'negated_current', false],
  ['Ya no pienso en suicidarme, pero necesito ayuda', 'negated_current', false],
  ['Intenté suicidarme hace diez años', 'past_attempt', false],
  ['Busco estadísticas sobre el suicidio', 'informational', false],
  ['Es para un trabajo sobre prevención del suicidio', 'informational', false],
  ['Leí una noticia sobre un suicidio', 'informational', false],
  ['Mi hermano no quiere suicidarse', 'negated_current', false],
  ['No quería hacerlo, pero ahora estoy pensando en suicidarme', 'active_self', true],
  ['No quiero seguir viviendo', 'active_self', true],
  ['Temo que mi amigo podría suicidarse', 'active_third_party', true],
  ['Hace años quería morir, pero ahora estoy bien', 'resolved_past', false],
  ['¿Qué hago si quiero morir?', 'hypothetical', false],
  ['Un artículo cita la frase quiero morir', 'informational', false],
  ['Suicidio', 'ambiguous', false],
  ['Necesito ayuda con una deuda', 'none', false]
];

for (const [input, context, urgent] of cases) {
  test(`classifies ${JSON.stringify(input)} as ${context}`, () => {
    assert.deepEqual(classifySuicideContext(input), { context, urgent });
  });
}

test('never throws for empty or non-string input', () => {
  for (const input of [null, undefined, 0, false, {}]) {
    const result = classifySuicideContext(input);
    assert.equal(typeof result.context, 'string');
    assert.equal(typeof result.urgent, 'boolean');
  }
});
