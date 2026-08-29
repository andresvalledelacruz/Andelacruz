import { submitStoryUpdateForModeration } from './story-update-submission-service.js';

function httpError(error) {
  if (['invalid_story_id', 'invalid_phase', 'invalid_update_length', 'invalid_author_secret'].includes(error)) {
    return { statusCode: 400, body: { error } };
  }
  if (error === 'story_not_found') return { statusCode: 404, body: { error } };
  if (['author_authorization_failed', 'author_authorization_unavailable'].includes(error)) {
    return { statusCode: 403, body: { error: 'author_authorization_failed' } };
  }
  if (error === 'staging_requires_synthetic_content') return { statusCode: 400, body: { error } };
  return { statusCode: 503, body: { error: 'story_update_unavailable' } };
}

export async function handleStoryUpdateSubmission({
  db,
  storyId,
  body = {},
  environment = 'staging',
  pepper = ''
} = {}) {
  const authorSecret = typeof body.author_secret === 'string' ? body.author_secret.trim() : '';
  const phase = typeof body.phase === 'string' ? body.phase.trim() : '';
  const text = typeof body.text === 'string' ? body.text : '';
  const synthetic = body.synthetic === true;

  const result = await submitStoryUpdateForModeration({
    db,
    storyId,
    authorSecret,
    phase,
    text,
    synthetic,
    environment,
    pepper
  });

  if (!result.ok) return httpError(result.error);

  return {
    statusCode: 202,
    body: {
      status: 'queued_for_moderation',
      candidate_id: result.candidate.id,
      environment,
      synthetic
    }
  };
}
