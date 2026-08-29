import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStorySubmissionMessage, mapStorySubmissionServiceResult } from '../src/story-submission-endpoint-contract.js';

test('builds the normalized moderation submission without any raw author credential', () => {
  const result = buildStorySubmissionMessage({
    body: {
      alias: '  Prueba  ',
      category: 'Duelo y Pérdidas',
      title: '  Historia sintética válida  ',
      story: '  Texto ficticio suficientemente largo para representar una historia sintética de staging sin datos personales reales.  ',
      needs: ['que_me_lean', 'desconocida', 'que_me_lean'],
      consent: true,
      synthetic: true
    },
    environment: 'staging',
    categories: ['Duelo y Pérdidas'],
    allowedNeeds: new Set(['que_me_lean']),
    submittedAt: '2026-08-29T06:30:00.000Z'
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    kind: 'story_submission',
    version: 1,
    environment: 'staging',
    source: 'web_staging',
    submitted_at: '2026-08-29T06:30:00.000Z',
    alias: 'Prueba',
    category: 'Duelo y Pérdidas',
    title: 'Historia sintética válida',
    story: 'Texto ficticio suficientemente largo para representar una historia sintética de staging sin datos personales reales.',
    needs: ['que_me_lean', 'que_me_lean'],
    synthetic: true
  });
  assert.equal('author_update_secret' in result.value, false);
  assert.equal('author_update_key_hash' in result.value, false);
});

test('preserves staging synthetic-only and consent validation before queueing', () => {
  const base = {
    alias: '', category: 'Duelo y Pérdidas', title: 'Historia sintética válida',
    story: 'Texto ficticio suficientemente largo para representar una historia sintética de staging sin datos personales reales.',
    needs: [], synthetic: true
  };
  const options = { environment: 'staging', categories: ['Duelo y Pérdidas'], allowedNeeds: new Set() };

  assert.deepEqual(buildStorySubmissionMessage({ body: { ...base, consent: false }, ...options }), { ok: false, statusCode: 400, error: 'consent_required' });
  assert.deepEqual(buildStorySubmissionMessage({ body: { ...base, consent: true, synthetic: false }, ...options }), { ok: false, statusCode: 400, error: 'staging_requires_synthetic_content' });
});

test('maps service failures without ever exposing a credential', () => {
  assert.deepEqual(mapStorySubmissionServiceResult({ ok: false, error: 'queue_unavailable' }), { statusCode: 503, body: { error: 'queue_unavailable' } });
  assert.deepEqual(mapStorySubmissionServiceResult({ ok: false, error: 'author_update_pepper_not_configured' }), { statusCode: 503, body: { error: 'author_update_pepper_not_configured' } });
  assert.deepEqual(mapStorySubmissionServiceResult({ ok: false, error: 'database_not_configured' }), { statusCode: 503, body: { error: 'database_not_configured' } });
});

test('returns the author credential only on a successful accepted submission', () => {
  const mapped = mapStorySubmissionServiceResult({
    ok: true,
    value: {
      status: 'queued_for_moderation', submission_id: 42, environment: 'staging',
      author_update_secret: 'abc_DEF-123'
    }
  });
  assert.equal(mapped.statusCode, 202);
  assert.deepEqual(mapped.body, {
    status: 'queued_for_moderation', submission_id: 42, environment: 'staging',
    author_update_secret: 'abc_DEF-123'
  });
});
