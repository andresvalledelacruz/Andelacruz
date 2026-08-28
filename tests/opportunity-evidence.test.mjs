import test from 'node:test';
import assert from 'node:assert/strict';
import { blendHypothesisWithEvidence, normalizeCommercialEvidence, normalizeSeoEvidence, resolveCandidateEvidence } from '../opportunity/evidence.mjs';
import { scoreCandidate } from '../opportunity/scoring.mjs';

test('SEO evidence produces a bounded measured signal', () => {
  const signal = normalizeSeoEvidence({ impressions: 12000, clicks: 600, position: 8, source: 'search_console' });
  assert.ok(signal.score >= 0 && signal.score <= 100);
  assert.equal(signal.reliability, 0.95);
});

test('measured evidence never fully erases the editorial prior', () => {
  const blended = blendHypothesisWithEvidence(80, { score: 20, reliability: 0.95 });
  assert.equal(blended.evidenceWeight, 0.9);
  assert.ok(blended.value > 20 && blended.value < 80);
});

test('commercial policy off remains zero even with revenue evidence', () => {
  const candidate = { commercialValue: 90, seoValue: 70, confidence: 0.5, commercialPolicy: 'off' };
  const resolved = resolveCandidateEvidence(candidate, { commercial: { sessions: 100, conversions: 20, revenue: 5000 } });
  assert.equal(resolved.commercial.value, 0);
});

test('scoring consumes measured evidence and records provenance', () => {
  const candidate = { id:'x', slug:'/x/', title:'X', domain:'test', userValue:80, seoValue:40, commercialValue:40, strategicFit:80, risk:'low', confidence:0.4, commercialPolicy:'standard' };
  const result = scoreCandidate(candidate, undefined, { seo: { impressions: 20000, clicks: 1500, position: 5, source:'search_console' } });
  assert.ok(result.dimensions.seoValue > 40);
  assert.notEqual(result.evidence.resolution.seo.status, 'hypothesis');
});

test('commercial evidence signal is bounded', () => {
  const signal = normalizeCommercialEvidence({ sessions: 1000, leads: 120, conversions: 35, revenue: 4000, source:'conversion_tracking' });
  assert.ok(signal.score >= 0 && signal.score <= 100);
});
