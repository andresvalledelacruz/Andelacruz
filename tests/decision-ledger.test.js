import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDecisionFingerprint, sanitizeDecisionEvent } from '../src/decision-ledger.js';

test('decision ledger removes sensitive free-text fields from metadata', () => {
  const event = sanitizeDecisionEvent({
    event_type: 'moderation',
    entity_type: 'story',
    entity_ref: '42',
    decision: 'approve',
    reason_code: 'safe_and_useful',
    safety_level: 'NONE',
    actor_class: 'staging_ops',
    occurred_at: '2026-08-26T20:00:00.000Z',
    metadata: {
      primary_route: 'work_career',
      story: 'texto sensible',
      alias: 'Persona',
      token: 'secreto',
      commercial_ui_allowed: true
    }
  });

  assert.equal(event.metadata.primary_route, 'work_career');
  assert.equal(event.metadata.commercial_ui_allowed, true);
  assert.equal('story' in event.metadata, false);
  assert.equal('alias' in event.metadata, false);
  assert.equal('token' in event.metadata, false);
});

test('decision fingerprint is deterministic for the same decision facts', () => {
  const base = {
    version: 1,
    event_type: 'product_evaluation',
    entity_type: 'product_change',
    entity_ref: 'proposal-demo',
    decision: 'EXPERIMENT',
    score: 72,
    actor_class: 'staging_ops',
    occurred_at: '2026-08-26T20:00:00.000Z'
  };
  assert.equal(buildDecisionFingerprint(base), buildDecisionFingerprint({ ...base }));
});

test('fingerprint changes when the decision changes', () => {
  const base = {
    version: 1,
    event_type: 'product_evaluation',
    entity_type: 'product_change',
    entity_ref: 'proposal-demo',
    score: 72,
    actor_class: 'staging_ops',
    occurred_at: '2026-08-26T20:00:00.000Z'
  };
  assert.notEqual(
    buildDecisionFingerprint({ ...base, decision: 'EXPERIMENT' }),
    buildDecisionFingerprint({ ...base, decision: 'HOLD' })
  );
});

test('invalid event types are rejected', () => {
  assert.throws(() => sanitizeDecisionEvent({
    event_type: 'random',
    entity_type: 'story',
    decision: 'approve'
  }), /invalid_event_type/);
});
