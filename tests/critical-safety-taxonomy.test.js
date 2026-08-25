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
