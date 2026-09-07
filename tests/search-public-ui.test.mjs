import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const searchPage = path.join(repoRoot, 'buscar', 'index.html');

async function html() {
  return readFile(searchPage, 'utf8');
}

test('public search page remains isolated from V9 and is not indexed before launch approval', async () => {
  const source = await html();
  assert.match(source, /<meta name="robots" content="noindex,follow">/i);
  assert.match(source, /https:\/\/desgracias\.es\/buscar\//i);
  assert.match(source, /\.\.\/src\/search-crisis-router\.js/);
});

test('public search page states local processing and discourages personal data', async () => {
  const source = await html();
  assert.match(source, /se procesa en tu dispositivo/i);
  assert.match(source, /no guarda el texto/i);
  assert.match(source, /No incluyas nombres, direcciones, teléfonos ni otros datos personales/i);
  assert.doesNotMatch(source, /fetch\s*\(/);
  assert.doesNotMatch(source, /XMLHttpRequest|sendBeacon|localStorage|sessionStorage/i);
});

test('P0 UI preserves immediate Spain resources and safe fallback', async () => {
  const source = await html();
  assert.match(source, /peligro inmediato, llama al 112/i);
  assert.match(source, /crisis suicida en España, también puedes llamar al 024/i);
  assert.match(source, /No quiero adivinar/i);
  assert.match(source, /no he podido identificar con suficiente seguridad/i);
});

test('search form has explicit labeling and live result region', async () => {
  const source = await html();
  assert.match(source, /<label for="search-query">/i);
  assert.match(source, /id="search-query"/i);
  assert.match(source, /aria-describedby="privacy-note"/i);
  assert.match(source, /aria-live="polite"/i);
});
