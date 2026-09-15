import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const bundle = fs.readFileSync('styles.css', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const sources = Array.from({ length: 7 }, (_, index) => fs.readFileSync(`styles-${index + 1}.css`, 'utf8'));

function classTokens(source) {
  return new Set((source.match(/\.[A-Za-z_][\w-]*/g) || []).filter(token => !/^\.\d/.test(token)));
}

test('producción carga una única hoja CSS y no conserva la cascada de @import', () => {
  assert.doesNotMatch(bundle, /@import\s/i);
  assert.equal((home.match(/<link\b[^>]*rel="stylesheet"[^>]*href="styles\.css"/g) || []).length, 1);
  for (let index = 1; index <= 7; index += 1) assert.doesNotMatch(home, new RegExp(`styles-${index}\\.css`));
});

test('el bundle consolidado conserva todas las clases conocidas de las siete hojas históricas', () => {
  const expected = new Set(sources.flatMap(source => [...classTokens(source)]));
  const actual = classTokens(bundle);
  const missing = [...expected].filter(token => !actual.has(token));
  assert.deepEqual(missing, [], `Clases CSS perdidas en consolidación: ${missing.join(', ')}`);
});

test('las hojas históricas se conservan solo como rollback y el bundle contiene las reglas nuevas sin inline', () => {
  assert.match(bundle, /\.resource-card-link/);
  assert.match(bundle, /\.resource-card-critical/);
  assert.match(bundle, /\.resource-link-cue/);
  assert.match(bundle, /\.urgent-help-link:focus-visible/);
});
