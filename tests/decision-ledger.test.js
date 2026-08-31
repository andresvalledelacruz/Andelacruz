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

test('decision ledger recursively removes sensitive keys from nested metadata and arrays', () => {
  const event = sanitizeDecisionEvent({
    event_type: 'safety_review',
    entity_type: 'safety_case',
    entity_ref: 'case-7',
    decision: 'escalate',
    safety_level: 'P1',
    occurred_at: '2026-08-31T05:00:00.000Z',
    metadata: {
      routing: {
        primary_route: 'urgent_safety',
        contact: {
          email: 'persona@example.test',
          phone: '+34000000000',
          safe_flag: true
        }
      },
      evidence: [
        { body: 'texto libre sensible', source_class: 'official' },
        { authorization: 'Bearer secret', safety_signal: 'P1' }
      ]
    }
  });

  assert.equal(event.metadata.routing.primary_route, 'urgent_safety');
  assert.equal(event.metadata.routing.contact.safe_flag, true);
  assert.equal('email' in event.metadata.routing.contact, false);
  assert.equal('phone' in event.metadata.routing.contact, false);
  assert.equal('body' in event.metadata.evidence[0], false);
  assert.equal(event.metadata.evidence[0].source_class, 'official');
  assert.equal('authorization' in event.metadata.evidence[1], false);
  assert.equal(event.metadata.evidence[1].safety_signal, 'P1');
});

test('decision ledger bounds nested strings, arrays and excessive depth', () => {
  const event = sanitizeDecisionEvent({
    event_type: 'system',
    entity_type: 'system',
    decision: 'audit',
    occurred_at: '2026-08-31T05:05:00.000Z',
    metadata: {
      long_text: 'x'.repeat(500),
      values: Array.from({ length: 30 }, (_, index) => index),
      nested: { a: { b: { c: { d: { e: 'too-deep' } } } } }
    }
  });

  assert.equal(event.metadata.long_text.length, 240);
  assert.equal(event.metadata.values.length, 20);
  assert.equal(event.metadata.nested.a.b.c.d, null);
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
