import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQueuedStorySubmission,
  prepareStoryAuthorUpdateKey,
  validateAuthorUpdatePepper
} from '../src/story-author-key-envelope.js';

const secret = 'Abcdefghijklmnopqrstuvwxyz_123456';
const pepper = 'staging-test-pepper-2026';

test('requires a configured server pepper before deriving an author update hash', () => {
  assert.equal(validateAuthorUpdatePepper('').ok, false);
  assert.equal(validateAuthorUpdatePepper('too-short').ok, false);
  assert.equal(validateAuthorUpdatePepper(pepper).ok, true);
});

test('derives only a hash from the raw author secret', () => {
  const result = prepareStoryAuthorUpdateKey({ secret, pepper });
  assert.equal(result.ok, true);
  assert.match(result.value.author_update_key_hash, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(result.value).includes(secret), false);
});

test('builds a moderation-safe story submission without raw secret aliases', () => {
  const result = buildQueuedStorySubmission({
    environment: 'staging',
    pepper,
    authorSecret: secret,
    submission: {
      kind: 'story_submission',
      title: 'Historia sintética de prueba',
      story: 'Texto ficticio suficientemente largo para representar un envío de staging sin incluir datos de una persona real.',
      synthetic: true,
      author_secret: secret,
      author_update_secret: secret,
      update_secret: secret
    }
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.synthetic, true);
  assert.match(result.value.author_update_key_hash, /^[a-f0-9]{64}$/);
  assert.equal('author_secret' in result.value, false);
  assert.equal('author_update_secret' in result.value, false);
  assert.equal('update_secret' in result.value, false);
  assert.equal(JSON.stringify(result.value).includes(secret), false);
});

test('staging refuses a non-synthetic story before producing a queued envelope', () => {
  const result = buildQueuedStorySubmission({
    environment: 'staging',
    pepper,
    authorSecret: secret,
    submission: { title: 'Historia real', synthetic: false }
  });
  assert.deepEqual(result, { ok: false, error: 'staging_requires_synthetic_content' });
});

test('invalid author secret fails closed', () => {
  const result = prepareStoryAuthorUpdateKey({ secret: 'weak', pepper });
  assert.deepEqual(result, { ok: false, error: 'invalid_author_secret' });
});
