import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreCandidate, rankCandidates } from '../opportunity/scoring.mjs';
import { CANDIDATE_PAGES } from '../opportunity/candidate-pages.mjs';
import { OPPORTUNITIES } from '../opportunity/registry.mjs';

test('all candidate opportunity ids exist in registry', () => {
  for (const candidate of CANDIDATE_PAGES) {
    for (const id of candidate.opportunities || []) {
      assert.ok(OPPORTUNITIES[id], `${candidate.id} references unknown opportunity ${id}`);
    }
  }
});

test('ranking is deterministic and descending', () => {
  const ranked = rankCandidates(CANDIDATE_PAGES, { limit: 20 });
  assert.equal(ranked.length, 20);
  for (let i = 1; i < ranked.length; i++) {
    assert.ok(ranked[i - 1].score >= ranked[i].score);
    assert.equal(ranked[i].rank, i + 1);
  }
});

test('higher risk receives a larger penalty with equal dimensions', () => {
  const base = { id:'a', slug:'/a/', title:'A', domain:'test', userValue:80, seoValue:80, commercialValue:80, strategicFit:80, confidence:1 };
  const low = scoreCandidate({ ...base, risk:'low' });
  const high = scoreCandidate({ ...base, id:'b', slug:'/b/', title:'B', risk:'high' });
  assert.ok(low.score > high.score);
  assert.ok(high.manualReview);
});

test('commercial policy off zeroes commercial value', () => {
  const result = scoreCandidate({ id:'off', slug:'/off/', title:'Off', domain:'test', userValue:80, seoValue:80, commercialValue:100, strategicFit:80, risk:'low', confidence:1, commercialPolicy:'off' });
  assert.equal(result.dimensions.commercialValue, 0);
});

test('low evidence confidence reduces priority without changing raw score', () => {
  const base = { id:'confidence', slug:'/c/', title:'Confidence', domain:'test', userValue:80, seoValue:80, commercialValue:80, strategicFit:80, risk:'low' };
  const low = scoreCandidate({ ...base, confidence:0.2 });
  const high = scoreCandidate({ ...base, confidence:0.9 });
  assert.equal(low.rawScore, high.rawScore);
  assert.ok(low.score < high.score);
});

test('very low user value blocks a candidate even if commercial value is high', () => {
  const result = scoreCandidate({ id:'bad', slug:'/bad/', title:'Bad', domain:'test', userValue:20, seoValue:90, commercialValue:100, strategicFit:80, risk:'low', confidence:1 });
  assert.equal(result.blocked, true);
});
