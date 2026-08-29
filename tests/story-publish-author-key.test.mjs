import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeAuthorUpdateKeyHash } from '../src/story-publish-author-key.js';

test('accepts a valid author update hash and normalizes case', () => {
  const upper = 'A'.repeat(64);
  assert.equal(normalizeAuthorUpdateKeyHash(upper), 'a'.repeat(64));
});

test('keeps legacy stories compatible when no author update hash exists', () => {
  assert.equal(normalizeAuthorUpdateKeyHash(null), null);
  assert.equal(normalizeAuthorUpdateKeyHash(''), null);
});

test('rejects malformed author hashes instead of persisting them', () => {
  assert.throws(() => normalizeAuthorUpdateKeyHash('not-a-hash'), /invalid_author_update_key_hash/);
});

test('publish processor schema and insert both propagate author_update_key_hash', () => {
  const source = fs.readFileSync(new URL('../src/publish-processor.js', import.meta.url), 'utf8');
  assert.match(source, /add column if not exists author_update_key_hash char\(64\)/i);
  assert.match(source, /normalizeAuthorUpdateKeyHash\(submission\.author_update_key_hash\)/);
  assert.match(source, /author_update_key_hash\s*\n\s*\) values/i);
});
