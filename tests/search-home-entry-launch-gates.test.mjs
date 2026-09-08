import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = fs.readFileSync(path.join(root, 'search-home-entry.js'), 'utf8');

test('homepage search entries keep explicit accessible names', () => {
  assert.match(entry, /link\.textContent = 'Buscar ayuda'/);
  assert.match(entry, /card\.setAttribute\('aria-label', 'Cuéntame qué te pasa y encuentra por dónde empezar'\)/);
  assert.match(entry, /title\.textContent = 'Cuéntame qué te pasa'/);
  assert.match(entry, /Encontrar por dónde empezar/);
  assert.doesNotMatch(entry, /tabindex\s*=\s*['"]?[1-9]/i);
  assert.doesNotMatch(entry, /autofocus/i);
});

test('every injected search link uses the same existing local destination', () => {
  assert.match(entry, /const SEARCH_URL = '\/buscar\/'/);
  const target = path.join(root, 'buscar', 'index.html');
  assert.equal(fs.existsSync(target), true, '/buscar/ must exist before homepage discovery is enabled');
  assert.ok((entry.match(/href = SEARCH_URL/g) || []).length >= 4);
  assert.doesNotMatch(entry, /target\s*=\s*['"]_blank['"]/i);
  assert.doesNotMatch(entry, /https?:\/\//i);
});

test('integration keeps Contact available elsewhere after promoting the hero card', () => {
  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(homepage, /mailto:info@desgracias\.es/);
  assert.match(homepage, />Contacto</);
});
