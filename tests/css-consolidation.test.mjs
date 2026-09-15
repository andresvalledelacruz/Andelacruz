import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const bundle = fs.readFileSync('styles.css', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const appCore = fs.readFileSync('app-core.js', 'utf8');
const sources = Array.from({ length: 7 }, (_, index) => fs.readFileSync(`styles-${index + 1}.css`, 'utf8'));

function classTokens(source) {
  return new Set((source.match(/\.[A-Za-z_][\w-]*/g) || []).filter(token => !/^\.\d/.test(token)));
}

const LEGACY_ONLY_CLASSES = new Set([
  '.safety-options-stack',
  '.safety-consent'
]);

test('producción carga una única hoja CSS y no conserva la cascada de @import', () => {
  assert.doesNotMatch(bundle, /@import\s/i);
  assert.equal((home.match(/<link\b[^>]*rel="stylesheet"[^>]*href="styles\.css"/g) || []).length, 1);
  for (let index = 1; index <= 7; index += 1) assert.doesNotMatch(home, new RegExp(`styles-${index}\\.css`));
});

test('el bundle consolidado conserva las clases históricas que siguen activas', () => {
  const expected = new Set(sources.flatMap(source => [...classTokens(source)]));
  const actual = classTokens(bundle);
  const runtimeSurface = `${home}\n${appCore}`;
  const missing = [...expected].filter(token => !actual.has(token) && !LEGACY_ONLY_CLASSES.has(token));
  assert.deepEqual(missing, [], `Clases CSS activas perdidas en consolidación: ${missing.join(', ')}`);
  for (const token of LEGACY_ONLY_CLASSES) {
    assert.equal(runtimeSurface.includes(token.slice(1)), false, `${token} se marcó legacy-only pero ha vuelto a runtime`);
  }
});

test('las hojas históricas se conservan solo como rollback y el bundle contiene las reglas nuevas sin inline', () => {
  assert.match(bundle, /\.resource-card-link/);
  assert.match(bundle, /\.resource-card-critical/);
  assert.match(bundle, /\.resource-link-cue/);
  assert.match(bundle, /\.urgent-help-link:focus-visible/);
});
