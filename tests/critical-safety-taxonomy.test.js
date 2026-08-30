import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCriticalSafety } from '../src/critical-safety-taxonomy.js';

test('suicidal intent activates P0, 112 and 024 without diagnosis', () => {
  const result = evaluateCriticalSafety({ story: 'Estoy pensando en quitarme la vida ahora.' });
  assert.equal(result.level, 'P0');
  assert.equal(result.safety_gateway, true);
  assert.equal(result.diagnostic, false);
  assert.ok(result.official_resources_spain.includes('112'));
  assert.ok(result.official_resources_spain.includes('024'));
});

test('active partner violence activates P0 and violence resources', () => {
  const result = evaluateCriticalSafety({ story: 'Mi pareja me está pegando y me va a matar.' });
  assert.equal(result.level, 'P0');
  assert.ok(result.official_resources_spain.includes('112'));
  assert.ok(result.official_resources_spain.includes('016'));
});

test('sexual violence triggers urgent human review without inventing diagnosis', () => {
  const result = evaluateCriticalSafety({ story: 'He sufrido una agresión sexual y necesito saber qué hacer.' });
  assert.equal(result.level, 'P1');
  assert.equal(result.human_review_required, true);
  assert.equal(result.automated_clinical_decision, false);
  assert.ok(result.official_resources_spain.includes('016'));
});

test('ordinary grief does not activate emergency gateway by keyword alone', () => {
  const result = evaluateCriticalSafety({ story: 'Mi padre falleció hace dos meses y sigo muy triste.' });
  assert.equal(result.level, 'NONE');
  assert.equal(result.safety_gateway, false);
});

test('acute medical language activates P0', () => {
  const result = evaluateCriticalSafety({ story: 'Tengo dolor en el pecho y no puedo respirar.' });
  assert.equal(result.level, 'P0');
  assert.ok(result.official_resources_spain.includes('112'));
});

test('harm to others is treated as P0 and suppresses commercial UI', () => {
  const result = evaluateCriticalSafety({ story: 'Voy a matar a alguien esta noche.' });
  assert.equal(result.level, 'P0');
  assert.equal(result.safety_gateway, true);
  assert.equal(result.human_review_required, true);
  assert.equal(result.suppress_commercial_ui, true);
  assert.ok(result.official_resources_spain.includes('112'));
});

test('overdose and severe withdrawal are P0 and never commercial', () => {
  const result = evaluateCriticalSafety({ story: 'Creo que es una sobredosis.' });
  assert.equal(result.level, 'P0');
  assert.equal(result.suppress_commercial_ui, true);
  assert.equal(result.automated_clinical_decision, false);
  assert.ok(result.official_resources_spain.includes('112'));
});

test('vulnerable-person abuse requires P1 human review and suppresses commerce', () => {
  const result = evaluateCriticalSafety({ story: 'Necesito ayuda por maltrato infantil.' });
  assert.equal(result.level, 'P1');
  assert.equal(result.safety_gateway, true);
  assert.equal(result.human_review_required, true);
  assert.equal(result.suppress_commercial_ui, true);
});

test('trafficking and coercion require P1 review and suppress commerce', () => {
  const result = evaluateCriticalSafety({ story: 'Estoy sufriendo trabajo forzoso y control coercitivo.' });
  assert.equal(result.level, 'P1');
  assert.equal(result.human_review_required, true);
  assert.equal(result.suppress_commercial_ui, true);
  assert.equal(result.diagnostic, false);
});

test('housing exposure remains P1 instead of being silently downgraded', () => {
  const result = evaluateCriticalSafety({ story: 'Duermo en la calle y necesito ayuda.' });
  assert.equal(result.level, 'P1');
  assert.equal(result.safety_gateway, true);
  assert.equal(result.human_review_required, true);
  assert.equal(result.suppress_commercial_ui, true);
});

test('disaster language is P0 with 112 and no commercial UI', () => {
  const result = evaluateCriticalSafety({ story: 'Hay un incendio ahora en el edificio.' });
  assert.equal(result.level, 'P0');
  assert.ok(result.official_resources_spain.includes('112'));
  assert.equal(result.suppress_commercial_ui, true);
});
