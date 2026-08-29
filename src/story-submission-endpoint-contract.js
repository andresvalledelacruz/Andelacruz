export function buildStorySubmissionMessage({
  body = {},
  environment = 'staging',
  categories = [],
  allowedNeeds = new Set(),
  submittedAt = new Date().toISOString()
} = {}) {
  const alias = typeof body.alias === 'string' ? body.alias.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const story = typeof body.story === 'string' ? body.story.trim() : '';
  const website = typeof body.website === 'string' ? body.website.trim() : '';
  const consent = body.consent === true;
  const synthetic = body.synthetic === true;
  const needs = Array.isArray(body.needs)
    ? body.needs.filter((item) => typeof item === 'string' && allowedNeeds.has(item)).slice(0, 4)
    : [];

  if (website) return { ok: false, statusCode: 202, body: { status: 'received' }, honeypot: true };
  if (!categories.includes(category)) return { ok: false, statusCode: 400, error: 'invalid_category' };
  if (alias.length > 40) return { ok: false, statusCode: 400, error: 'alias_too_long' };
  if (title.length < 8 || title.length > 120) return { ok: false, statusCode: 400, error: 'invalid_title_length' };
  if (story.length < 80 || story.length > 5000) return { ok: false, statusCode: 400, error: 'invalid_story_length' };
  if (!consent) return { ok: false, statusCode: 400, error: 'consent_required' };
  if (environment === 'staging' && !synthetic) {
    return { ok: false, statusCode: 400, error: 'staging_requires_synthetic_content' };
  }

  return {
    ok: true,
    value: {
      kind: 'story_submission',
      version: 1,
      environment,
      source: environment === 'staging' ? 'web_staging' : 'web',
      submitted_at: submittedAt,
      alias: alias || null,
      category,
      title,
      story,
      needs,
      synthetic
    }
  };
}

export function mapStorySubmissionServiceResult(result) {
  if (result?.ok) return { statusCode: 202, body: result.value };

  const error = result?.error || 'queue_unavailable';
  const statusCode = [
    'queue_unavailable',
    'database_not_configured',
    'author_update_pepper_not_configured'
  ].includes(error) ? 503 : 400;

  return { statusCode, body: { error } };
}
