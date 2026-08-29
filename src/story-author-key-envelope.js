import crypto from 'node:crypto';
import { hashAuthorSecret, validateAuthorSecret } from './story-update-policy.js';

export function generateAuthorUpdateSecret() {
  return crypto.randomBytes(32).toString('base64url');
}

export function validateAuthorUpdatePepper(pepper) {
  const value = String(pepper || '');
  if (value.length < 16 || value.length > 512) {
    return { ok: false, error: 'author_update_pepper_not_configured' };
  }
  return { ok: true, value };
}

export function prepareStoryAuthorUpdateKey({ secret, pepper } = {}) {
  const checkedSecret = validateAuthorSecret(secret);
  if (!checkedSecret.ok) return checkedSecret;

  const checkedPepper = validateAuthorUpdatePepper(pepper);
  if (!checkedPepper.ok) return checkedPepper;

  return {
    ok: true,
    value: {
      author_update_key_hash: hashAuthorSecret(checkedSecret.value, checkedPepper.value)
    }
  };
}

export function buildQueuedStorySubmission({ submission = {}, authorSecret, pepper, environment = 'staging' } = {}) {
  const synthetic = submission.synthetic === true;
  if (environment === 'staging' && !synthetic) {
    return { ok: false, error: 'staging_requires_synthetic_content' };
  }

  const preparedKey = prepareStoryAuthorUpdateKey({ secret: authorSecret, pepper });
  if (!preparedKey.ok) return preparedKey;

  const {
    author_secret: _authorSecret,
    author_update_secret: _authorUpdateSecret,
    update_secret: _updateSecret,
    ...safeSubmission
  } = submission;

  return {
    ok: true,
    value: {
      ...safeSubmission,
      synthetic,
      author_update_key_hash: preparedKey.value.author_update_key_hash
    }
  };
}
