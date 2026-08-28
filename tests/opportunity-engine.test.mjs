import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOpportunity } from '../opportunity/engine.mjs';

 test('safety gate disables monetization', () => {
  const out = evaluateOpportunity({ flags:['critical_safety'], needs:['find_job'], intents:['LOAN'] });
  assert.equal(out.monetization, 'MONETIZATION_OFF');
  assert.equal(out.opportunities.length, 0);
 });

 test('loan needs explicit intent and affordability check', () => {
  const blocked = evaluateOpportunity({ intents:['LOAN'], flags:[] });
  assert.equal(blocked.monetization, 'MONETIZATION_OFF');
  const allowed = evaluateOpportunity({ intents:['LOAN'], flags:['affordability_checked'] });
  assert.equal(allowed.opportunities[0].id, 'LOAN');
 });

 test('training requires market evidence', () => {
  const blocked = evaluateOpportunity({ needs:['training_gap'], flags:[] });
  assert.equal(blocked.monetization, 'MONETIZATION_OFF');
  const allowed = evaluateOpportunity({ needs:['training_gap'], flags:['market_evidence'] });
  assert.equal(allowed.opportunities[0].id, 'TRAINING');
 });

 test('matchmaking is never inferred without explicit intent', () => {
  const out = evaluateOpportunity({ needs:['psychological_support'], intents:[] });
  assert.equal(out.opportunities.some(x => x.id === 'MATCHMAKING'), false);
 });

 test('employment bottlenecks map to distinct opportunities', () => {
  const cv = evaluateOpportunity({ needs:['cv_help'] });
  const interview = evaluateOpportunity({ needs:['interview_help'] });
  assert.equal(cv.opportunities[0].id, 'CV_SERVICE');
  assert.equal(interview.opportunities[0].id, 'INTERVIEW_COACHING');
 });
