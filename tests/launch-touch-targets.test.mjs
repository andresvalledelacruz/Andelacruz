import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const urgentNav = await readFile(new URL('../urgent-help-nav.js', import.meta.url), 'utf8');
const urgentPage = await readFile(new URL('../ayuda-urgente.html', import.meta.url), 'utf8');
const searchCss = await readFile(new URL('../buscar/v9-search.css', import.meta.url), 'utf8');

test('homepage critical header controls keep a 44px minimum touch target', () => {
  assert.match(urgentNav, /\.urgent-help-link\{[\s\S]*?min-height:44px;/);
  assert.match(urgentNav, /\.nav-toggle\{min-width:44px;min-height:44px;\}/);
  assert.doesNotMatch(urgentNav, /\.urgent-help-link\{min-height:(?:38|42)px/);
});

test('urgent-help mobile navigation keeps 44px minimum touch targets', () => {
  assert.match(urgentPage, /\.menu-toggle\{[^}]*min-width:44px;min-height:44px;/);
  assert.match(urgentPage, /@media\(max-width:1250px\)[\s\S]*?\.urgent-nav a\{[^}]*min-height:44px;/);
});

test('search critical phone and urgent-help links keep a 44px minimum touch target', () => {
  assert.match(searchCss, /a\[href\^="tel:"\],a\[href="\/ayuda-urgente\.html"\]\{[^}]*min-height:44px/);
});
