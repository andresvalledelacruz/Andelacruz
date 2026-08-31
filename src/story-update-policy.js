import crypto from 'node:crypto';

export const updatePhases = new Set([
  'dias_despues',
  'semanas_despues',
  'mes_1',
  'mes_3',
  'mes_6',
  'ano_1',
  'otro'
]);

export function normalizeUpdateText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function validateUpdateInput(input = {}) {
  const phase = String(input.phase || '').trim();
  const text = normalizeUpdateText(input.text);
  const synthetic = input.synthetic === true;

  if (!updatePhases.has(phase)) return { ok: false, error: 'invalid_phase' };
  if (text.length < 80 || text.length > 3000) return { ok: false, error: 'invalid_update_length' };
  return { ok: true, value: { phase, text, synthetic } };
}

export function validateAuthorSecret(secret) {
  const value = String(secret || '').trim();
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(value)) return { ok: false, error: 'invalid_author_secret' };
  return { ok: true, value };
}

export function hashAuthorSecret(secret, pepper = '') {
  const checked = validateAuthorSecret(secret);
  if (!checked.ok) throw new Error(checked.error);
  return crypto
    .createHash('sha256')
    .update(`desgracias-author-update:v1:${pepper}:${checked.value}`)
    .digest('hex');
}

export function secureHashEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function authorizeStoryUpdate({ secret, expectedHash, pepper = '' } = {}) {
  const checked = validateAuthorSecret(secret);
  if (!checked.ok) return checked;
  if (!/^[a-f0-9]{64}$/i.test(String(expectedHash || ''))) {
    return { ok: false, error: 'author_authorization_unavailable' };
  }

  const actualHash = hashAuthorSecret(checked.value, pepper);
  if (!secureHashEqual(actualHash, expectedHash)) {
    return { ok: false, error: 'author_authorization_failed' };
  }

  return { ok: true };
}

export function buildStoryUpdateModerationMessage({
  storyId,
  storySlug,
  phase,
  text,
  synthetic = false,
  environment = 'staging',
  submittedAt = new Date().toISOString()
} = {}) {
  const update = validateUpdateInput({ phase, text, synthetic });
  if (!update.ok) return update;

  const normalizedStoryId = String(storyId || '').trim();
  const normalizedStorySlug = String(storySlug || '').trim();
  if (!normalizedStoryId || !normalizedStorySlug) {
    return { ok: false, error: 'story_identity_required' };
  }
  if (environment === 'staging' && update.value.synthetic !== true) {
    return { ok: false, error: 'staging_requires_synthetic_content' };
  }
  if (!submittedAt || Number.isNaN(Date.parse(submittedAt))) {
    return { ok: false, error: 'invalid_submitted_at' };
  }

  return {
    ok: true,
    value: {
      kind: 'story_update_submission',
      version: 1,
      environment,
      source: 'author_update',
      submitted_at: submittedAt,
      story_id: normalizedStoryId,
      story_slug: normalizedStorySlug,
      phase: update.value.phase,
      text: update.value.text,
      // Mirror only while the item is in moderation so the generic Executive/Safety
      // evaluator receives the update body through its canonical `story` field.
      story: update.value.text,
      synthetic: update.value.synthetic,
      moderation_required: true,
      publish_directly: false
    }
  };
}

export function publicPhaseLabel(phase) {
  return {
    dias_despues: 'Días después',
    semanas_despues: 'Semanas después',
    mes_1: 'Mes 1',
    mes_3: 'Mes 3',
    mes_6: 'Mes 6',
    ano_1: 'Año 1',
    otro: 'Después'
  }[phase] || 'Después';
}
