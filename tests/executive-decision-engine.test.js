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

test('holds a product change with weak evidence even when every other score is maximal', () => {
  const result = evaluateExecutiveDecision({
    kind: 'product_change',
    evidence: ['hypothesis-only'],
    scores: {
      user_value: 5,
      evidence_strength: 2,
      ux_clarity: 5,
      engineering_readiness: 5,
      security_privacy: 5,
      safety: 5,
      google_quality: 5,
      measurement: 5,
      business_value: 5,
      maintainability: 5
    }
  });
  assert.equal(result.score >= 80, true);
  assert.equal(result.decision, 'HOLD');
  assert.ok(result.requirements.some((item) => item.includes('evidencia suficiente')));
  assert.equal(result.guardrails.evidence_required_before_scale, true);
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

test('critical safety also reads alternate consumer text fields', () => {
  for (const [field, value] of [
    ['text', 'Tengo dolor en el pecho y necesito ayuda.'],
    ['body', 'Estoy pensando en quitarme la vida.'],
    ['content', 'Me está pegando ahora mismo.'],
    ['message', 'No puedo respirar.'],
    ['description', 'Hay un incendio ahora.'],
    ['detail', 'Creo que ha sufrido una sobredosis.'],
    ['moderation_safety_text', 'Estoy pensando en quitarme la vida.']
  ]) {
    const result = evaluateExecutiveDecision({ kind: 'user_case', [field]: value });
    assert.equal(result.decision, 'SAFETY_GATEWAY', `expected ${field} to reach the safety gateway`);
    assert.equal(result.commercial_ui_allowed, false);
  }
});

test('critical safety combines story with alternate fields instead of replacing either source', () => {
  const result = evaluateExecutiveDecision({
    kind: 'user_case',
    story: 'Quiero explicar una actualización.',
    message: 'Ahora no puedo respirar.'
  });
  assert.equal(result.decision, 'SAFETY_GATEWAY');
  assert.ok(result.safety.matched_groups.some(({ group }) => group === 'acute_medical'));
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


test('Meta-Brain holds sensitive business proposals for human professional review', () => {
  const result = evaluateExecutiveDecision({
    kind: 'product_change',
    front: 'ethical_business',
    flags: ['mental_health', 'professional_services'],
    evidence: ['market-signal'],
    scores: {
      user_value: 5,
      evidence_strength: 5,
      ux_clarity: 5,
      engineering_readiness: 5,
      security_privacy: 5,
      safety: 5,
      google_quality: 5,
      measurement: 5,
      business_value: 5,
      maintainability: 5
    }
  });
  assert.equal(result.decision, 'HOLD');
  assert.equal(result.strategic_governance.decision, 'HUMAN_REVIEW_REQUIRED');
  assert.equal(result.strategic_governance.monetization_allowed, false);
  assert.ok(result.strategic_governance.frameworks.includes('/redteam'));
});

test('Meta-Brain attaches governed next-move frameworks to ordinary product work', () => {
  const result = evaluateExecutiveDecision({
    kind: 'product_change',
    front: 'product_readiness',
    evidence: ['verified-user-need'],
    scores: {
      user_value: 4,
      evidence_strength: 4,
      ux_clarity: 4,
      engineering_readiness: 4,
      security_privacy: 4,
      safety: 4,
      google_quality: 4,
      measurement: 4,
      business_value: 4,
      maintainability: 4
    }
  });
  assert.equal(result.strategic_governance.decision, 'PROCEED_WITH_GUARDRAILS');
  assert.equal(result.strategic_governance.evidence_count, 1);
  assert.ok(result.strategic_governance.frameworks.includes('/nextmove'));
});


test('Meta-Brain safety gateway records an explicit auditable hard block', () => {
  const result = evaluateExecutiveDecision({
    kind: 'product_change',
    front: 'ethical_business',
    flags: ['p0_p1', 'mental_health'],
    scores: {
      user_value: 5,
      evidence_strength: 5,
      ux_clarity: 5,
      engineering_readiness: 5,
      security_privacy: 5,
      safety: 5,
      google_quality: 5,
      measurement: 5,
      business_value: 5,
      maintainability: 5
    }
  });
  assert.equal(result.decision, 'BLOCKED');
  assert.ok(result.hard_blocks.some(({ id }) => id === 'meta_brain_safety_gateway'));
});

test('Meta-Brain human review hold explains the required next action', () => {
  const result = evaluateExecutiveDecision({
    kind: 'product_change',
    front: 'ethical_business',
    flags: ['legal'],
    scores: {
      user_value: 5,
      evidence_strength: 5,
      ux_clarity: 5,
      engineering_readiness: 5,
      security_privacy: 5,
      safety: 5,
      google_quality: 5,
      measurement: 5,
      business_value: 5,
      maintainability: 5
    }
  });
  assert.equal(result.decision, 'HOLD');
  assert.ok(result.requirements.some((item) => item.includes('revisión humana/profesional')));
  assert.equal(result.strategic_governance.requires_official_current_sources, true);
});
