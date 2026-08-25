import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateExecutiveDecision } from '../src/executive-decision-engine.js';

test('blocks product changes that exploit vulnerable users even with high commercial scores', () => {
  const result = evaluateExecutiveDecision({
    kind: 'product_change',
    scores: {
      user_value: 4,
      evidence_strength: 4,
      ux_clarity: 4,
      engineering_readiness: 4,
      security_privacy: 5,
      safety: 5,
      google_quality: 5,
      measurement: 5,
      business_value: 5,
      maintainability: 4
    },
    hard_blocks: { exploits_vulnerability: true }
  });
  assert.equal(result.decision, 'BLOCKED');
  assert.ok(result.hard_blocks.some((item) => item.id === 'exploits_vulnerability'));
});

test('holds a product change when safety is weak regardless of aggregate score', () => {
  const result = evaluateExecutiveDecision({
    kind: 'product_change',
    scores: {
      user_value: 5,
      evidence_strength: 5,
      ux_clarity: 5,
      engineering_readiness: 5,
      security_privacy: 5,
      safety: 2,
      google_quality: 5,
      measurement: 5,
      business_value: 5,
      maintainability: 5
    }
  });
  assert.equal(result.decision, 'HOLD');
});

test('allows a strong balanced feature to become a scale candidate', () => {
  const result = evaluateExecutiveDecision({
    kind: 'product_change',
    scores: {
      user_value: 5,
      evidence_strength: 4,
      ux_clarity: 4,
      engineering_readiness: 4,
      security_privacy: 5,
      safety: 5,
      google_quality: 4,
      measurement: 4,
      business_value: 4,
      maintainability: 4
    }
  });
  assert.equal(result.decision, 'SCALE_CANDIDATE');
});

test('critical user case switches the whole experience into safety gateway', () => {
  const result = evaluateExecutiveDecision({
    kind: 'user_case',
    category: 'Otras historias',
    title: 'Necesito ayuda ahora',
    story: 'Estoy pensando en quitarme la vida y necesito ayuda inmediata.'
  });
  assert.equal(result.decision, 'SAFETY_GATEWAY');
  assert.equal(result.commercial_ui_allowed, false);
  assert.equal(result.analytics_mode, 'minimal_aggregate_only');
  assert.equal(result.diagnostic, false);
});

test('non-critical dismissal routes multidisciplinary support without medicalizing by default', () => {
  const result = evaluateExecutiveDecision({
    kind: 'user_case',
    category: 'Trabajo',
    title: 'Me han despedido con 55 años',
    story: 'Me preocupa encontrar empleo y pagar mis gastos, pero quiero ordenar los siguientes pasos.',
    needs: ['recursos_practicos']
  });
  assert.equal(result.decision, 'ROUTE_WITH_GUARDRAILS');
  assert.equal(result.multidisciplinary.primary_need.id, 'work_career');
  assert.equal(result.diagnostic, false);
});
