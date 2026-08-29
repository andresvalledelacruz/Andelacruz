import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authorizeStoryUpdate,
  buildStoryUpdateModerationMessage,
  hashAuthorSecret,
  publicPhaseLabel,
  secureHashEqual,
  validateAuthorSecret,
  validateUpdateInput
} from '../src/story-update-policy.js';

test('accepts a valid synthetic update', () => {
  const result = validateUpdateInput({
    phase: 'mes_3',
    text: 'Han pasado tres meses y esta actualización ficticia explica con suficiente detalle qué cambió desde la historia original y qué sigue siendo difícil ahora.',
    synthetic: true
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.phase, 'mes_3');
});

test('rejects short updates', () => {
  const result = validateUpdateInput({ phase: 'mes_1', text: 'Muy corto.', synthetic: true });
  assert.deepEqual(result, { ok: false, error: 'invalid_update_length' });
});

test('rejects unknown phases', () => {
  const result = validateUpdateInput({
    phase: 'viral',
    text: 'Este texto tiene longitud suficiente pero usa una fase que no pertenece al contrato temporal autorizado del producto.',
    synthetic: true
  });
  assert.deepEqual(result, { ok: false, error: 'invalid_phase' });
});

test('author secret is validated and only its hash is comparable', () => {
  const secret = 'A_secure-demo-author_secret_1234567890';
  assert.equal(validateAuthorSecret(secret).ok, true);
  const hash = hashAuthorSecret(secret, 'test-pepper');
  assert.equal(hash.length, 64);
  assert.equal(secureHashEqual(hash, hashAuthorSecret(secret, 'test-pepper')), true);
  assert.equal(secureHashEqual(hash, hashAuthorSecret(`${secret}x`, 'test-pepper')), false);
});

test('author update authorization fails closed on missing or wrong authorization', () => {
  const secret = 'A_secure-demo-author_secret_1234567890';
  const expectedHash = hashAuthorSecret(secret, 'pepper');

  assert.deepEqual(
    authorizeStoryUpdate({ secret, expectedHash, pepper: 'pepper' }),
    { ok: true }
  );
  assert.deepEqual(
    authorizeStoryUpdate({ secret: `${secret}x`, expectedHash, pepper: 'pepper' }),
    { ok: false, error: 'author_authorization_failed' }
  );
  assert.deepEqual(
    authorizeStoryUpdate({ secret, expectedHash: '', pepper: 'pepper' }),
    { ok: false, error: 'author_authorization_unavailable' }
  );
});

test('story update message always enters moderation and never direct publication', () => {
  const result = buildStoryUpdateModerationMessage({
    storyId: 'story-123',
    storySlug: 'historia-sintetica',
    phase: 'mes_3',
    text: 'Han pasado tres meses y esta actualización ficticia describe con suficiente detalle qué ha cambiado desde la publicación original y qué aspectos siguen pendientes.',
    synthetic: true,
    environment: 'staging',
    submittedAt: '2026-08-29T05:00:00.000Z'
  });

  assert.equal(result.ok, true);
  assert.equal(result.value.kind, 'story_update_submission');
  assert.equal(result.value.moderation_required, true);
  assert.equal(result.value.publish_directly, false);
  assert.equal(result.value.story_id, 'story-123');
});

test('staging rejects non-synthetic author updates', () => {
  const result = buildStoryUpdateModerationMessage({
    storyId: 'story-123',
    storySlug: 'historia-sintetica',
    phase: 'mes_1',
    text: 'Esta actualización tiene longitud suficiente para validar el contrato, pero deliberadamente no se marca como sintética en un entorno de staging.',
    synthetic: false,
    environment: 'staging'
  });

  assert.deepEqual(result, { ok: false, error: 'staging_requires_synthetic_content' });
});

test('phase labels are human readable', () => {
  assert.equal(publicPhaseLabel('ano_1'), 'Año 1');
  assert.equal(publicPhaseLabel('mes_3'), 'Mes 3');
});
