import test from 'node:test';
import assert from 'node:assert/strict';
import { hashAuthorSecret } from '../src/story-update-policy.js';
import { submitStoryUpdateForModeration } from '../src/story-update-submission-service.js';

const secret = 'Abcdefghijklmnopqrstuvwxyz_123456';
const pepper = 'test-pepper';

function createDb({ failQueue = false } = {}) {
  const calls = [];
  return {
    calls,
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (sql === 'begin' || sql === 'commit' || sql === 'rollback') return { rows: [] };
      if (/select id, slug, author_update_key_hash/i.test(sql)) {
        return { rows: [{ id: 7, slug: 'historia-demo', synthetic: true, author_update_key_hash: hashAuthorSecret(secret, pepper) }] };
      }
      if (/insert into staging_story_update_candidates/i.test(sql)) {
        return { rows: [{ id: 41, story_id: 7, phase: params[1], synthetic: params[3], submitted_at: params[4], status: 'pending_moderation' }] };
      }
      if (/pgmq\.send/i.test(sql)) {
        if (failQueue) throw new Error('queue down');
        return { rows: [{ msg_id: 99 }] };
      }
      if (/update staging_story_update_candidates/i.test(sql)) return { rows: [] };
      throw new Error(`unexpected query: ${sql}`);
    }
  };
}

const validInput = {
  storyId: 7,
  authorSecret: secret,
  phase: 'mes_3',
  text: 'Han pasado tres meses y quería contar cómo ha cambiado mi situación desde que compartí la historia por primera vez.',
  synthetic: true,
  environment: 'staging',
  pepper
};

test('queues an authorized update atomically for human moderation', async () => {
  const db = createDb();
  const result = await submitStoryUpdateForModeration({ db, ...validInput });
  assert.equal(result.ok, true);
  assert.equal(result.status, 'queued_for_moderation');
  assert.equal(result.moderation_message_id, 99);
  assert.equal(db.calls[0].sql, 'begin');
  assert.equal(db.calls.at(-1).sql, 'commit');
  const queueCall = db.calls.find((call) => /pgmq\.send/i.test(call.sql));
  assert.equal(queueCall.params[0], 'moderation');
  const message = JSON.parse(queueCall.params[1]);
  assert.equal(message.kind, 'story_update_submission');
  assert.equal(message.moderation_required, true);
  assert.equal(message.publish_directly, false);
  assert.equal(message.candidate_id, 41);
});

test('rolls back candidate creation if moderation queue fails', async () => {
  const db = createDb({ failQueue: true });
  const result = await submitStoryUpdateForModeration({ db, ...validInput });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'story_update_submission_failed');
  assert.equal(db.calls.at(-1).sql, 'rollback');
  assert.equal(db.calls.some((call) => call.sql === 'commit'), false);
});

test('fails closed before writing when author authorization is wrong', async () => {
  const db = createDb();
  const result = await submitStoryUpdateForModeration({ db, ...validInput, authorSecret: `${secret}x` });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'author_authorization_failed');
  assert.equal(db.calls.at(-1).sql, 'rollback');
  assert.equal(db.calls.some((call) => /insert into staging_story_update_candidates/i.test(call.sql)), false);
});

test('never writes directly to published story updates', async () => {
  const db = createDb();
  const result = await submitStoryUpdateForModeration({ db, ...validInput });
  assert.equal(result.ok, true);
  const sql = db.calls.map((call) => call.sql).join('\n');
  assert.doesNotMatch(sql, /insert into staging_story_updates\b/i);
});
