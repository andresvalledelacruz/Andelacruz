export function normalizeAuthorUpdateKeyHash(value) {
  const hash = String(value || '').trim().toLowerCase();
  if (!hash) return null;
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    throw new Error('invalid_author_update_key_hash');
  }
  return hash;
}
