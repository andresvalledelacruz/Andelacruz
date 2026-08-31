import test from 'node:test';
import assert from 'node:assert/strict';
import { BUSINESS_PROMPT_MATRIX, STRATEGIC_FRAMEWORKS, selectStrategicFrameworks } from '../src/strategic-meta-brain.js';

test('catalog preserves all 99 distinct reasoning modes', () => {
  assert.equal(STRATEGIC_FRAMEWORKS.length, 99);
  assert.equal(new Set(STRATEGIC_FRAMEWORKS.map(({ id }) => id)).size, 99);
});

test('every business prompt 1-120 has exactly one governed classification', () => {
  assert.deepEqual(BUSINESS_PROMPT_MATRIX.map(({ id }) => id), Array.from({ length: 120 }, (_, i) => i + 1));
  assert.ok(BUSINESS_PROMPT_MATRIX.every(({ section, classification }) => section && classification));
});

test('fictional testimonials are rejected and legal prompts require review', () => {
  assert.equal(BUSINESS_PROMPT_MATRIX[36].classification, 'NO_APLICABLE_A_DESGRACIAS');
  assert.equal(BUSINESS_PROMPT_MATRIX[15].classification, 'REQUIERE_PROFESIONAL_ASESORIA');
});

test('Safety overrides business frameworks for P0/P1', () => {
  const result = selectStrategicFrameworks({ front: 'ethical_business', flags: ['p0_p1','mental_health'] });
  assert.equal(result.decision, 'SAFETY_GATEWAY');
  assert.equal(result.monetization_allowed, false);
  assert.equal(result.requires_human_professional_review, true);
  assert.ok(result.frameworks.includes('/redteam'));
});

test('ordinary operational work proceeds with guardrails', () => {
  const result = selectStrategicFrameworks({ front: 'backup_dr', evidence: ['restore-audit'] });
  assert.equal(result.decision, 'PROCEED_WITH_GUARDRAILS');
  assert.equal(result.evidence_count, 1);
});
