import test from 'node:test';
import assert from 'node:assert/strict';
import { isIndexable, parseMetaDirectives } from '../scripts/lib/robots-indexability.mjs';

test('indexa por defecto cuando no existe meta robots', () => {
  assert.equal(isIndexable('<html><head></head><body></body></html>'), true);
});

test('excluye noindex en robots aunque content aparezca antes que name', () => {
  const html = '<meta content="noindex, follow" name="robots">';
  assert.equal(isIndexable(html), false);
});

test('excluye noindex específico de googlebot', () => {
  const html = '<meta name="robots" content="index,follow"><meta name="googlebot" content="noindex,follow">';
  assert.equal(isIndexable(html), false);
});

test('no confunde index con noindex ni mayúsculas', () => {
  assert.equal(isIndexable('<meta NAME="ROBOTS" CONTENT="INDEX, FOLLOW">'), true);
  assert.deepEqual(parseMetaDirectives('<meta NAME="ROBOTS" CONTENT="NOINDEX, FOLLOW">', 'robots'), ['noindex', 'follow']);
});
