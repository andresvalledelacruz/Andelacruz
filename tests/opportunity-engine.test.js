import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOpportunities } from '../src/opportunity-engine/evaluate.js';

test('turns monetization off on critical safety signals', () => {
  const result = evaluateOpportunities({
    signals: ['suicidal_crisis', 'multiple_debts', 'wants_lower_monthly_payment'],
    explicitIntents: ['debt_consolidation'],
    commercialConsent: true
  });
  assert.equal(result.monetization, 'off');
  assert.equal(result.reason, 'safety_gate');
  assert.deepEqual(result.candidates, []);
});

test('detects debt consolidation but does not show commercial CTA without active partner', () => {
  const result = evaluateOpportunities({
    signals: ['multiple_debts', 'wants_lower_monthly_payment'],
    explicitIntents: ['debt_consolidation'],
    commercialConsent: true
  });
  assert.equal(result.monetization, 'opportunity_detected');
  assert.equal(result.candidates[0].id, 'debt_consolidation');
  assert.equal(result.candidates[0].canShowCommercialCta, false);
});

test('does not infer matchmaking without explicit intent', () => {
  const result = evaluateOpportunities({
    signals: ['wants_to_meet_people_for_dating'],
    explicitIntents: []
  });
  assert.equal(result.monetization, 'none');
});

test('detects non-explicit-intent employment opportunity', () => {
  const result = evaluateOpportunities({
    signals: ['actively_looking_for_job']
  });
  assert.equal(result.monetization, 'opportunity_detected');
  assert.equal(result.candidates[0].id, 'job_search_services');
});
