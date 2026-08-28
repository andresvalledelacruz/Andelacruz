import test from 'node:test';
import assert from 'node:assert/strict';
import { CANDIDATE_PAGES } from '../opportunity/candidate-pages.mjs';
import { buildProductionQueue, queueSummary, PRODUCTION_STATES } from '../opportunity/production-queue.mjs';

test('production queue respects requested size and domain cap',()=>{
  const queue=buildProductionQueue(CANDIDATE_PAGES,{policy:{limit:20,maxPerDomain:6}});
  assert.equal(queue.length,20);
  const summary=queueSummary(queue);
  assert.ok(Object.values(summary.byDomain).every(n=>n<=6));
});

test('production queue caps high risk concentration',()=>{
  const queue=buildProductionQueue(CANDIDATE_PAGES,{policy:{limit:20,maxHighRisk:5}});
  assert.ok(queueSummary(queue).highRisk<=5);
});

test('production queue reserves lower risk work',()=>{
  const queue=buildProductionQueue(CANDIDATE_PAGES,{policy:{limit:20,reserveLowRisk:6}});
  assert.ok(queueSummary(queue).lowRisk>=6);
});

test('every queued item receives an operational state',()=>{
  const queue=buildProductionQueue(CANDIDATE_PAGES);
  const allowed=new Set(Object.values(PRODUCTION_STATES));
  assert.ok(queue.every(x=>allowed.has(x.state)));
});
