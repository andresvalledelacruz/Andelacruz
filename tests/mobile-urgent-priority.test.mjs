import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Regresión visual expresamente autorizada por el propietario tras QA real en iPhone/Safari.
const css = await readFile(new URL('../styles-7.css', import.meta.url), 'utf8');

test('mobile header keeps urgent help fully inside the viewport and visually first', () => {
  assert.match(css, /@media \(max-width:760px\)[\s\S]*?\.header-inner \{[\s\S]*?grid-template-columns:minmax\(0,1fr\) 44px !important;/);
  assert.match(css, /\.header-inner \.urgent-help-link\{[\s\S]*?grid-row:2;[\s\S]*?width:100% !important;[\s\S]*?min-width:0 !important;[\s\S]*?min-height:56px !important;/);
  assert.match(css, /\.header-inner \.urgent-help-link\{[\s\S]*?background:#8A4939 !important;[\s\S]*?color:#fff !important;/);
});

test('mobile story CTA is secondary and follows urgent help', () => {
  assert.match(css, /\.header-inner \.header-cta\{[\s\S]*?grid-row:3;[\s\S]*?min-height:44px;[\s\S]*?background:rgba\(123,63,30,\.07\);[\s\S]*?box-shadow:none;/);
});
