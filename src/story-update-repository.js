import { authorizeStoryUpdate, buildStoryUpdateModerationMessage } from './story-update-policy.js';

export async function prepareStoryUpdateSubmission({
  db,
  storyId,
  authorSecret,
  phase,
  text,
  synthetic = false,
  environment = 'staging',
  pepper = '',
  submittedAt = new Date().toISOString()
} = {}) {
  if (!db || typeof db.query !== 'function') return { ok: false, error: 'database_unavailable' };
  const normalizedStoryId = String(storyId || '').trim();
  if (!/^\d+$/.test(normalizedStoryId)) return { ok: false, error: 'invalid_story_id' };

  const lookup = await db.query(
    `select id, slug, author_update_key_hash, synthetic
       from staging_published_stories
      where id = $1
      limit 1`,
    [normalizedStoryId]
  );
  const story = lookup?.rows?.[0];
  if (!story) return { ok: false, error: 'story_not_found' };

  const authorization = authorizeStoryUpdate({
    secret: authorSecret,
    expectedHash: story.author_update_key_hash,
    pepper
  });
  if (!authorization.ok) return authorization;

  if (environment === 'staging' && (synthetic !== true || story.synthetic !== true)) {
    return { ok: false, error: 'staging_requires_synthetic_content' };
  }

  const moderation = buildStoryUpdateModerationMessage({
    storyId: story.id,
    storySlug: story.slug,
    phase,
    text,
    synthetic,
    environment,
    submittedAt
  });
  if (!moderation.ok) return moderation;

  return { ok: true, story, moderation: moderation.value };
}

export async function insertStoryUpdateCandidate({ db, prepared } = {}) {
  if (!db || typeof db.query !== 'function') return { ok: false, error: 'database_unavailable' };
  if (!prepared?.ok || !prepared.story || !prepared.moderation) {
    return { ok: false, error: 'prepared_submission_required' };
  }

  const message = prepared.moderation;
  if (message.moderation_required !== true || message.publish_directly !== false) {
    return { ok: false, error: 'unsafe_moderation_contract' };
  }

  const inserted = await db.query(
    `insert into staging_story_update_candidates
       (story_id, phase, update_text, synthetic, submitted_at, status)
     values ($1, $2, $3, $4, $5, 'pending_moderation')
     returning id, story_id, phase, synthetic, submitted_at, status`,
    [prepared.story.id, message.phase, message.text, message.synthetic, message.submitted_at]
  );
  const candidate = inserted?.rows?.[0];
  if (!candidate) return { ok: false, error: 'candidate_insert_failed' };
  return { ok: true, candidate, moderation: { ...message, candidate_id: candidate.id } };
}
