import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateOutcomes, learningSignals } from '../opportunity/outcomes.mjs';
import { readFile } from 'node:fs/promises';

function events(count, type='helpful') {
  return Array.from({ length: count }, (_, i) => ({
    decisionId: `d-${i}`,
    type,
    opportunityId: 'TEST_OPPORTUNITY',
    recommendationKind: 'partner'
  }));
}

test('fewer than 10 outcomes stay early', () => {
  const signal = learningSignals(aggregateOutcomes(events(9))).TEST_OPPORTUNITY;
  assert.equal(signal.status, 'early');
  assert.equal(signal.sampleSize, 9);
});

test('10 outcomes become partial but not measured', () => {
  const signal = learningSignals(aggregateOutcomes(events(10))).TEST_OPPORTUNITY;
  assert.equal(signal.status, 'partial');
  assert.ok(signal.confidence < 0.8);
});

test('50 outcomes become measured at bounded confidence', () => {
  const signal = learningSignals(aggregateOutcomes(events(50))).TEST_OPPORTUNITY;
  assert.equal(signal.status, 'measured');
  assert.equal(signal.confidence, 0.8);
});

test('database snapshot policy preserves the same 10 and 50 thresholds', async () => {
  const sql = await readFile(new URL('../supabase/migrations/20260828064900_automate_opportunity_learning_snapshots.sql', import.meta.url), 'utf8');
  assert.match(sql, /when count\(\*\) >= 50 then 'measured'/i);
  assert.match(sql, /when count\(\*\) >= 10 then 'partial'/i);
  assert.match(sql, /where opportunity_id is not null/i);
});
