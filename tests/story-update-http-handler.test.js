import test from 'node:test';
import assert from 'node:assert/strict';
import { hashAuthorSecret } from '../src/story-update-policy.js';
import { handleStoryUpdateSubmission } from '../src/story-update-http-handler.js';

const secret = 'Abcdefghijklmnopqrstuvwxyz_123456';
const pepper = 'test-pepper';

function createDb({ story = true } = {}) {
  const calls = [];
  return {
    calls,
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (sql === 'begin' || sql === 'commit' || sql === 'rollback') return { rows: [] };
      if (/select id, slug, author_update_key_hash/i.test(sql)) {
        return { rows: story ? [{ id: 7, slug: 'historia-demo', synthetic: true, author_update_key_hash: hashAuthorSecret(secret, pepper) }] : [] };
      }
      if (/insert into staging_story_update_candidates/i.test(sql)) {
        return { rows: [{ id: 41, story_id: 7, phase: params[1], synthetic: params[3], submitted_at: params[4], status: 'pending_moderation' }] };
      }
      if (/pgmq\.send/i.test(sql)) return { rows: [{ msg_id: 99 }] };
      if (/update staging_story_update_candidates/i.test(sql)) return { rows: [] };
      throw new Error(`unexpected query: ${sql}`);
    }
  };
}

const validBody = {
  author_secret: secret,
  phase: 'mes_3',
  text: 'Han pasado tres meses y quería contar cómo ha cambiado mi situación desde que compartí la historia por primera vez.',
  synthetic: true
};

test('returns 202 without leaking author secret or moderation message id', async () => {
  const db = createDb();
  const response = await handleStoryUpdateSubmission({ db, storyId: '7', body: validBody, environment: 'staging', pepper });
  assert.equal(response.statusCode, 202);
  assert.deepEqual(response.body, {
    status: 'queued_for_moderation',
    candidate_id: 41,
    environment: 'staging',
    synthetic: true
  });
  assert.equal(JSON.stringify(response.body).includes(secret), false);
  assert.equal('moderation_message_id' in response.body, false);
});

test('maps invalid payload to 400', async () => {
  const db = createDb();
  const response = await handleStoryUpdateSubmission({ db, storyId: '7', body: { ...validBody, phase: 'viral' }, environment: 'staging', pepper });
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, 'invalid_phase');
});

test('maps missing story to 404', async () => {
  const db = createDb({ story: false });
  const response = await handleStoryUpdateSubmission({ db, storyId: '7', body: validBody, environment: 'staging', pepper });
  assert.equal(response.statusCode, 404);
  assert.equal(response.body.error, 'story_not_found');
});

test('normalizes authorization failures to 403 without exposing internal reason', async () => {
  const db = createDb();
  const response = await handleStoryUpdateSubmission({ db, storyId: '7', body: { ...validBody, author_secret: `${secret}x` }, environment: 'staging', pepper });
  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { error: 'author_authorization_failed' });
});
