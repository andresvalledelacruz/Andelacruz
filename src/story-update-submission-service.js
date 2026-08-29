import { insertStoryUpdateCandidate, prepareStoryUpdateSubmission } from './story-update-repository.js';

export async function submitStoryUpdateForModeration({
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

  try {
    await db.query('begin');

    const prepared = await prepareStoryUpdateSubmission({
      db,
      storyId,
      authorSecret,
      phase,
      text,
      synthetic,
      environment,
      pepper,
      submittedAt
    });
    if (!prepared.ok) {
      await db.query('rollback');
      return prepared;
    }

    const inserted = await insertStoryUpdateCandidate({ db, prepared });
    if (!inserted.ok) {
      await db.query('rollback');
      return inserted;
    }

    const moderationMessage = {
      ...inserted.moderation,
      candidate_id: inserted.candidate.id
    };

    if (moderationMessage.moderation_required !== true || moderationMessage.publish_directly !== false) {
      await db.query('rollback');
      return { ok: false, error: 'unsafe_moderation_contract' };
    }

    const queued = await db.query(
      'select pgmq.send($1, $2::jsonb) as msg_id',
      ['moderation', JSON.stringify(moderationMessage)]
    );
    const moderationMessageId = queued?.rows?.[0]?.msg_id ?? null;
    if (!moderationMessageId) {
      await db.query('rollback');
      return { ok: false, error: 'moderation_queue_failed' };
    }

    await db.query(
      `update staging_story_update_candidates
          set moderation_message_id = $1
        where id = $2
          and status = 'pending_moderation'`,
      [moderationMessageId, inserted.candidate.id]
    );

    await db.query('commit');
    return {
      ok: true,
      candidate: inserted.candidate,
      moderation_message_id: moderationMessageId,
      status: 'queued_for_moderation'
    };
  } catch (error) {
    await db.query('rollback').catch(() => {});
    return { ok: false, error: 'story_update_submission_failed' };
  }
}
