import test from 'node:test';
import assert from 'node:assert/strict';
import {
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

test('phase labels are human readable', () => {
  assert.equal(publicPhaseLabel('ano_1'), 'Año 1');
  assert.equal(publicPhaseLabel('mes_3'), 'Mes 3');
});
