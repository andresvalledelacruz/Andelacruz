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

test('normalizes common sensitive flag variants before governance', () => {
  const result = selectStrategicFrameworks({ front: 'ethical_business', flags: [' Mental-Health '] });
  assert.equal(result.decision, 'HUMAN_REVIEW_REQUIRED');
  assert.equal(result.monetization_allowed, false);
  assert.deepEqual(result.unknown_flags, []);
});

test('unknown flags fail closed and remain auditable', () => {
  const result = selectStrategicFrameworks({ front: 'ethical_business', flags: ['mental-heath'] });
  assert.equal(result.decision, 'HUMAN_REVIEW_REQUIRED');
  assert.equal(result.monetization_allowed, false);
  assert.equal(result.requires_human_professional_review, true);
  assert.deepEqual(result.unknown_flags, ['mental_heath']);
  assert.ok(result.frameworks.includes('/redteam'));
});

test('known operational flags do not create a false sensitive hold', () => {
  const result = selectStrategicFrameworks({ front: 'backup_dr', flags: ['operational', 'backup-dr'] });
  assert.equal(result.decision, 'PROCEED_WITH_GUARDRAILS');
  assert.deepEqual(result.unknown_flags, []);
});

test('normalizes known strategic front variants before selecting frameworks', () => {
  const result = selectStrategicFrameworks({ front: ' Backup-DR ', flags: ['operational'] });
  assert.equal(result.front, 'backup_dr');
  assert.equal(result.unknown_front, null);
  assert.equal(result.decision, 'PROCEED_WITH_GUARDRAILS');
  assert.ok(result.frameworks.includes('/worstcase'));
});

test('unknown strategic fronts fail closed and remain auditable', () => {
  const result = selectStrategicFrameworks({ front: 'safty', flags: ['operational'] });
  assert.equal(result.front, 'safty');
  assert.equal(result.unknown_front, 'safty');
  assert.equal(result.decision, 'HUMAN_REVIEW_REQUIRED');
  assert.equal(result.monetization_allowed, false);
  assert.equal(result.requires_human_professional_review, true);
  assert.ok(result.frameworks.includes('/redteam'));
});

test('cancer front always remains under human professional review', () => {
  const result = selectStrategicFrameworks({ front: 'cancer', flags: ['ymyl', 'health', 'cancer'], evidence: ['ministerio-sanidad', 'seom'] });
  assert.equal(result.decision, 'HUMAN_REVIEW_REQUIRED');
  assert.equal(result.monetization_allowed, false);
  assert.equal(result.requires_official_current_sources, true);
  assert.equal(result.requires_human_professional_review, true);
  assert.equal(result.unknown_front, null);
  assert.deepEqual(result.unknown_flags, []);
});

test('cancer front fails closed even when caller omits sensitive flags', () => {
  const result = selectStrategicFrameworks({ front: 'cancer' });
  assert.equal(result.decision, 'HUMAN_REVIEW_REQUIRED');
  assert.equal(result.monetization_allowed, false);
  assert.equal(result.requires_official_current_sources, true);
  assert.equal(result.requires_human_professional_review, true);
});

test('accidental emergency front fails closed even when caller omits sensitive flags', () => {
  const result = selectStrategicFrameworks({ front: 'accidental-emergencies' });
  assert.equal(result.decision, 'HUMAN_REVIEW_REQUIRED');
  assert.equal(result.monetization_allowed, false);
  assert.equal(result.requires_official_current_sources, true);
  assert.equal(result.requires_human_professional_review, true);
});

test('accidental emergency becomes Safety Gateway for immediate risk', () => {
  const result = selectStrategicFrameworks({ front: 'accidental-emergencies', flags: ['p0-p1', 'immediate-risk', 'health', 'minors'] });
  assert.equal(result.decision, 'SAFETY_GATEWAY');
  assert.equal(result.monetization_allowed, false);
  assert.equal(result.automated_individual_advice_allowed, false);
  assert.equal(result.unknown_front, null);
  assert.deepEqual(result.unknown_flags, []);
});
