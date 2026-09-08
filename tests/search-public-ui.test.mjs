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
  assert.match(source, /\.\.\/src\/search-clarification\.js/);
});

test('public search page states browser-local processing and discourages personal data', async () => {
  const source = await html();
  assert.match(source, /procesa la búsqueda en tu navegador/i);
  assert.match(source, /Desgracias\.es no envía ni almacena el texto/i);
  assert.match(source, /No incluyas nombres, direcciones, teléfonos ni otros datos personales/i);
  assert.match(source, /spellcheck="false"/i);
  assert.match(source, /autocorrect="off"/i);
  assert.doesNotMatch(source, /fetch\s*\(/);
  assert.doesNotMatch(source, /XMLHttpRequest|sendBeacon|localStorage|sessionStorage/i);
});

test('dynamic results avoid HTML string injection surfaces', async () => {
  const source = await html();
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
  assert.match(source, /\.textContent\s*=/);
  assert.match(source, /replaceChildren\(\)/);
});

test('P0 UI preserves immediate Spain resources and safe fallback', async () => {
  const source = await html();
  assert.match(source, /Llamar al 112/i);
  assert.match(source, /Llamar al 024/i);
  assert.match(source, /Llamar al 016/i);
  assert.match(source, /href: 'tel:112'/i);
  assert.match(source, /href: 'tel:024'/i);
  assert.match(source, /href: 'tel:016'/i);
  assert.match(source, /officialResources\(routed\.official_resources_spain\)/);
  assert.match(source, /Lo primero es tu seguridad/i);
  assert.match(source, /Lo primero es la seguridad de esa persona/i);
  assert.match(source, /Ver ayuda urgente/i);
});

test('ambiguous searches render explicit clarification choices instead of guessing', async () => {
  const source = await html();
  assert.match(source, /buildSearchClarification\(routed\)/);
  assert.match(source, /Opciones para aclarar la situación/i);
  assert.match(source, /type: 'button'/);
  assert.match(source, /showClarificationFollowUp\(option\)/);
  assert.match(source, /Cuéntame un poco más/i);
  assert.match(source, /query\.focus\(\)/);
});

test('ambiguous suicide wording shows optional urgent help without hiding clarification', async () => {
  const source = await html();
  assert.match(source, /routed\.urgent_support\?\.available/);
  assert.match(source, /No asumimos que estés en una crisis/i);
  assert.match(source, /peligro inmediato, contacta con el 112/i);
  assert.match(source, /también está disponible el 024/i);
  assert.match(source, /paragraphWithLink\(routed\.urgent_support\.label, routed\.urgent_support\.url\)/);
  assert.match(source, /result\.append\(\s*element\('h2', clarification\.title\)/);
});

test('clarification UI does not silently route non-P0 choices', async () => {
  const source = await html();
  assert.match(source, /if \(option\.id === 'safety_self'\)/);
  assert.match(source, /if \(option\.id === 'safety_other'\)/);
  assert.doesNotMatch(source, /option\.url/);
});

test('search form has explicit labeling and live result region', async () => {
  const source = await html();
  assert.match(source, /<label for="search-query">/i);
  assert.match(source, /id="search-query"/i);
  assert.match(source, /aria-describedby="privacy-note"/i);
  assert.match(source, /aria-live="polite"/i);
  assert.match(source, /role: 'group'/);
});
