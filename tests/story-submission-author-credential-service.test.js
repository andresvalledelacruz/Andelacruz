import test from 'node:test';
import assert from 'node:assert/strict';
import { queueStorySubmissionWithAuthorCredential } from '../src/story-submission-author-credential-service.js';

const pepper = 'staging-test-pepper-2026';
const submission = {
  kind: 'story_submission',
  version: 1,
  environment: 'staging',
  source: 'web_staging',
  submitted_at: '2026-08-29T06:00:00.000Z',
  alias: 'Prueba',
  category: 'Duelo y Pérdidas',
  title: 'Historia sintética de prueba',
  story: 'Texto ficticio suficientemente largo para representar un envío de staging sin incluir datos de una persona real.',
  needs: ['que_me_lean'],
  synthetic: true
};

test('queues only the hash and returns the raw author secret once in the response', async () => {
  let queuedPayload = null;
  const db = {
    async query(_sql, params) {
      queuedPayload = JSON.parse(params[1]);
      return { rows: [{ msg_id: 321 }] };
    }
  };

  const result = await queueStorySubmissionWithAuthorCredential({ db, submission, pepper, environment: 'staging' });

  assert.equal(result.ok, true);
  assert.equal(result.value.status, 'queued_for_moderation');
  assert.equal(result.value.submission_id, 321);
  assert.match(result.value.author_update_secret, /^[A-Za-z0-9_-]{43}$/);
  assert.match(queuedPayload.author_update_key_hash, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(queuedPayload).includes(result.value.author_update_secret), false);
  assert.equal('author_update_secret' in queuedPayload, false);
});

test('never returns an author secret when queueing fails', async () => {
  const db = {
    async query() {
      throw new Error('queue down');
    }
  };

  const result = await queueStorySubmissionWithAuthorCredential({ db, submission, pepper, environment: 'staging' });
  assert.deepEqual(result, { ok: false, error: 'queue_unavailable' });
});

test('fails before queueing when server pepper is unavailable', async () => {
  let called = false;
  const db = {
    async query() {
      called = true;
      return { rows: [{ msg_id: 1 }] };
    }
  };

  const result = await queueStorySubmissionWithAuthorCredential({ db, submission, pepper: '', environment: 'staging' });
  assert.deepEqual(result, { ok: false, error: 'author_update_pepper_not_configured' });
  assert.equal(called, false);
});

test('staging rejects non-synthetic content before queueing', async () => {
  let called = false;
  const db = {
    async query() {
      called = true;
      return { rows: [{ msg_id: 1 }] };
    }
  };

  const result = await queueStorySubmissionWithAuthorCredential({
    db,
    submission: { ...submission, synthetic: false },
    pepper,
    environment: 'staging'
  });

  assert.deepEqual(result, { ok: false, error: 'staging_requires_synthetic_content' });
  assert.equal(called, false);
});
