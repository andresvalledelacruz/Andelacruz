import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Regresión visual expresamente autorizada por el propietario tras QA real en iPhone/Safari.
const css = await readFile(new URL('../styles-7.css', import.meta.url), 'utf8');

test('mobile header keeps urgent help fully inside the viewport and visually first', () => {
  assert.match(css, /@media \(max-width:760px\)[\s\S]*?\.header-inner\{[\s\S]*?grid-template-columns:minmax\(0,1fr\) 44px !important;/);
  assert.match(css, /\.header-inner \.urgent-help-link\{[\s\S]*?grid-row:2;[\s\S]*?width:100% !important;[\s\S]*?min-width:0 !important;[\s\S]*?min-height:56px !important;/);
  assert.match(css, /\.header-inner \.urgent-help-link\{[\s\S]*?background:#8A4939 !important;[\s\S]*?color:#fff !important;/);
});

test('story CTA is a visible intermediate priority below urgent help', () => {
  assert.match(css, /\.header-cta\{[\s\S]*?border:1px solid #C88463;[\s\S]*?background:#D9A487;[\s\S]*?color:#5B2F25;[\s\S]*?box-shadow:0 5px 14px rgba\(91,47,37,\.12\);/);
  assert.match(css, /@media \(max-width:760px\)[\s\S]*?\.header-inner \.header-cta\{[\s\S]*?background:#D9A487;[\s\S]*?color:#5B2F25;/);
});

test('trust banner stays visually softer than the actionable story CTA', () => {
  assert.match(css, /\.hero-final-banner\{[\s\S]*?border:1px solid rgba\(183,141,102,\.30\);[\s\S]*?background:rgba\(255,249,242,\.62\);[\s\S]*?box-shadow:none;/);
  assert.match(css, /\.hero-final-banner \.banner-shield\{[\s\S]*?background:rgba\(234,204,151,\.58\);/);
});
