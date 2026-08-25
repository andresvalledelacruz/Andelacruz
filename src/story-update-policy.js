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
