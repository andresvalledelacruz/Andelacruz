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

test('combina etiquetas repetidas y conserva la restricción independientemente del orden', () => {
  for (const name of ['robots', 'googlebot']) {
    for (const rules of [['index,follow', 'noindex'], ['noindex', 'index,follow']]) {
      const html = rules.map(content => `<meta name="${name}" content="${content}">`).join('');
      assert.equal(isIndexable(html), false, `${name}: ${rules.join(' / ')}`);
    }
  }
  assert.deepEqual(parseMetaDirectives('<meta name="robots" content="index"><meta name="robots" content="nofollow">', 'robots'), ['index', 'nofollow']);
});

test('none impide indexación en robots y googlebot, pero no en otros agentes', () => {
  for (const name of ['robots', 'googlebot']) {
    assert.equal(isIndexable(`<meta name="robots" content="index,follow"><meta name="${name}" content="NONE">`), false);
  }
  assert.equal(isIndexable('<meta name="otherbot" content="none">'), true);
  assert.equal(isIndexable('<meta name="robots" content="all, nofollow">'), true);
});
