import {
  buildQueuedStorySubmission,
  generateAuthorUpdateSecret
} from './story-author-key-envelope.js';

export async function queueStorySubmissionWithAuthorCredential({
  db,
  submission,
  pepper,
  environment = 'staging'
} = {}) {
  if (!db || typeof db.query !== 'function') {
    return { ok: false, error: 'database_not_configured' };
  }

  const authorSecret = generateAuthorUpdateSecret();
  const queuedSubmission = buildQueuedStorySubmission({
    submission,
    authorSecret,
    pepper,
    environment
  });
  if (!queuedSubmission.ok) return queuedSubmission;

  try {
    const { rows } = await db.query(
      'select pgmq.send($1, $2::jsonb) as msg_id',
      ['moderation', JSON.stringify(queuedSubmission.value)]
    );
    const submissionId = rows?.[0]?.msg_id ?? null;
    if (submissionId === null || submissionId === undefined) {
      return { ok: false, error: 'queue_unavailable' };
    }

    return {
      ok: true,
      value: {
        status: 'queued_for_moderation',
        submission_id: submissionId,
        environment,
        author_update_secret: authorSecret
      }
    };
  } catch {
    return { ok: false, error: 'queue_unavailable' };
  }
}
