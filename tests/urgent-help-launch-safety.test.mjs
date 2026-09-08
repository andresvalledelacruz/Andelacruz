import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../ayuda-urgente.html', import.meta.url), 'utf8');

test('urgent help removes capture and distracting community navigation', () => {
  assert.doesNotMatch(page, /Cuéntanos tu historia|story-cta/i);
  assert.doesNotMatch(page, /#historias|#comunidad|#profesionales/i);
});

test('urgent help avoids an impossible safety guarantee and third-party fonts', () => {
  assert.doesNotMatch(page, /Estás a salvo aquí/i);
  assert.match(page, /Puedes consultar estos recursos sin identificarte/i);
  assert.doesNotMatch(page, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);
});

test('urgent help keeps direct emergency calls and the post-attempt route', () => {
  for (const number of ['112', '024', '061', '091', '062', '016', '900018018']) {
    assert.match(page, new RegExp(`href="tel:${number}"`));
  }
  assert.match(page, /href="\/alguien-cercano-ha-intentado-suicidarse\/"/i);
});
