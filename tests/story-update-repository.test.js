import test from 'node:test';
import assert from 'node:assert/strict';
import { hashAuthorSecret } from '../src/story-update-policy.js';
import { prepareStoryUpdateSubmission, insertStoryUpdateCandidate } from '../src/story-update-repository.js';

const secret = 'Abcdefghijklmnopqrstuvwxyz_123456';
const pepper = 'test-pepper';

function dbWithStory(overrides = {}) {
  const calls = [];
  return {
    calls,
    async query(sql, params) {
      calls.push({ sql, params });
      if (/select id, slug/i.test(sql)) {
        return { rows: [{ id: 7, slug: 'historia-demo', synthetic: true, author_update_key_hash: hashAuthorSecret(secret, pepper), ...overrides }] };
      }
      if (/insert into staging_story_update_candidates/i.test(sql)) {
        return { rows: [{ id: 41, story_id: 7, phase: params[1], synthetic: params[3], submitted_at: params[4], status: 'pending_moderation' }] };
      }
      throw new Error('unexpected query');
    }
  };
}

test('prepares an authorized synthetic update without writing', async () => {
  const db = dbWithStory();
  const result = await prepareStoryUpdateSubmission({ db, storyId: 7, authorSecret: secret, phase: 'mes_3', text: 'Han pasado tres meses y quería contar cómo ha cambiado mi situación desde que compartí la historia por primera vez.', synthetic: true, environment: 'staging', pepper });
  assert.equal(result.ok, true);
  assert.equal(result.moderation.moderation_required, true);
  assert.equal(result.moderation.publish_directly, false);
  assert.equal(db.calls.length, 1);
});

test('fails closed when author hash is unavailable', async () => {
  const db = dbWithStory({ author_update_key_hash: null });
  const result = await prepareStoryUpdateSubmission({ db, storyId: 7, authorSecret: secret, phase: 'mes_3', text: 'Han pasado tres meses y quería contar cómo ha cambiado mi situación desde que compartí la historia por primera vez.', synthetic: true, environment: 'staging', pepper });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'author_authorization_unavailable');
  assert.equal(db.calls.length, 1);
});

test('rejects real content in staging before candidate insertion', async () => {
  const db = dbWithStory();
  const result = await prepareStoryUpdateSubmission({ db, storyId: 7, authorSecret: secret, phase: 'mes_3', text: 'Han pasado tres meses y quería contar cómo ha cambiado mi situación desde que compartí la historia por primera vez.', synthetic: false, environment: 'staging', pepper });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'staging_requires_synthetic_content');
  assert.equal(db.calls.length, 1);
});

test('candidate insertion is pending moderation and never direct publication', async () => {
  const db = dbWithStory();
  const prepared = await prepareStoryUpdateSubmission({ db, storyId: 7, authorSecret: secret, phase: 'mes_3', text: 'Han pasado tres meses y quería contar cómo ha cambiado mi situación desde que compartí la historia por primera vez.', synthetic: true, environment: 'staging', pepper });
  const inserted = await insertStoryUpdateCandidate({ db, prepared });
  assert.equal(inserted.ok, true);
  assert.equal(inserted.candidate.status, 'pending_moderation');
  assert.equal(inserted.moderation.publish_directly, false);
  assert.match(db.calls[1].sql, /pending_moderation/);
  assert.doesNotMatch(db.calls[1].sql, /staging_story_updates\s/i);
});
