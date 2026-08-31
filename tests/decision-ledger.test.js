import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDecisionFingerprint, sanitizeDecisionEvent, verifyDecisionFingerprint } from '../src/decision-ledger.js';

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

test('decision ledger removes compound and camelCase variants of sensitive keys', () => {
  const event = sanitizeDecisionEvent({
    event_type: 'moderation',
    entity_type: 'story',
    entity_ref: 'compound-sensitive-keys',
    decision: 'escalate',
    safety_level: 'P1',
    occurred_at: '2026-08-31T14:10:00.000Z',
    metadata: {
      user_email: 'persona@example.test',
      contactPhone: '+34000000000',
      story_text: 'texto libre muy sensible',
      messageBody: 'otro texto libre sensible',
      auth_token: 'secret-token',
      apiSecret: 'secret-value',
      authorization_header: 'Bearer secret',
      source_class: 'official',
      nested: {
        authorAlias: 'Persona',
        safety_signal: 'P1'
      }
    }
  });

  assert.equal(event.metadata.source_class, 'official');
  assert.equal(event.metadata.nested.safety_signal, 'P1');
  for (const key of ['user_email', 'contactPhone', 'story_text', 'messageBody', 'auth_token', 'apiSecret', 'authorization_header']) {
    assert.equal(key in event.metadata, false);
  }
  assert.equal('authorAlias' in event.metadata.nested, false);
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

test('v2 fingerprint protects sanitized metadata from later mutation', () => {
  const event = sanitizeDecisionEvent({
    event_type: 'safety_review',
    entity_type: 'safety_case',
    entity_ref: 'case-integrity',
    decision: 'escalate',
    safety_level: 'P1',
    occurred_at: '2026-08-31T06:30:00.000Z',
    metadata: { source_class: 'official', commercial_ui_allowed: false }
  });

  assert.equal(event.version, 2);
  assert.equal(verifyDecisionFingerprint(event), true);
  assert.equal(verifyDecisionFingerprint({
    ...event,
    metadata: { ...event.metadata, commercial_ui_allowed: true }
  }), false);
});

test('v2 fingerprint is stable across metadata key order', () => {
  const base = {
    version: 2,
    event_type: 'system',
    entity_type: 'system',
    decision: 'audit',
    occurred_at: '2026-08-31T06:35:00.000Z'
  };

  assert.equal(
    buildDecisionFingerprint({ ...base, metadata: { b: 2, a: { y: 2, x: 1 } } }),
    buildDecisionFingerprint({ ...base, metadata: { a: { x: 1, y: 2 }, b: 2 } })
  );
});

test('v1 fingerprints remain verifiable for historical ledger events', () => {
  const legacy = {
    version: 1,
    event_type: 'moderation',
    entity_type: 'story',
    entity_ref: 'legacy-1',
    decision: 'approve',
    reason_code: null,
    score: null,
    safety_level: 'NONE',
    actor_class: 'staging_ops',
    occurred_at: '2026-08-26T20:00:00.000Z',
    metadata: { mutable_under_v1: true }
  };
  const fingerprint = buildDecisionFingerprint(legacy);

  assert.equal(verifyDecisionFingerprint({ ...legacy, fingerprint }), true);
  assert.equal(verifyDecisionFingerprint({
    ...legacy,
    metadata: { mutable_under_v1: false },
    fingerprint
  }), true);
});

test('invalid event types are rejected', () => {
  assert.throws(() => sanitizeDecisionEvent({
    event_type: 'random',
    entity_type: 'story',
    decision: 'approve'
  }), /invalid_event_type/);
});
