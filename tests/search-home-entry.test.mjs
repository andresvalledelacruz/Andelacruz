import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const loader = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const entry = fs.readFileSync(new URL('../search-home-entry.js', import.meta.url), 'utf8');
const homepage = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('homepage loader includes the search entry layer before analytics', () => {
  const searchIndex = loader.indexOf("load('/search-home-entry.js')");
  const analyticsIndex = loader.indexOf("load('/visitor-analytics.js')");
  assert.ok(searchIndex >= 0, 'search entry layer must be loaded');
  assert.ok(analyticsIndex > searchIndex, 'search discovery must not wait for analytics');
});

test('search entry layer exposes the orienter in four discoverable homepage locations', () => {
  assert.match(entry, /dataset\.searchEntry = 'main-nav'/);
  assert.match(entry, /dataset\.searchEntry = 'hero'/);
  assert.match(entry, /dataset\.searchEntry = 'needs'/);
  assert.match(entry, /dataset\.searchEntry = 'footer'/);
  assert.ok((entry.match(/href = SEARCH_URL/g) || []).length >= 4);
  assert.match(entry, /Buscar ayuda/);
  assert.match(entry, /Cuéntame qué te pasa/);
  assert.match(entry, /Encontrar por dónde empezar/);
});

test('integration reuses V9 components instead of replacing homepage structure', () => {
  assert.match(homepage, /class="hero-final-actions"/);
  assert.match(homepage, /<h3>Busco orientación<\/h3>/);
  assert.match(homepage, /id="main-nav"/);
  assert.match(entry, /\.hero-final-actions/);
  assert.match(entry, /\.needs-grid \.need-card/);
  assert.doesNotMatch(entry, /innerHTML/);
  assert.doesNotMatch(entry, /document\.write/);
});

test('search discovery layer does not introduce network, storage or query propagation', () => {
  for (const forbidden of [
    /fetch\s*\(/,
    /XMLHttpRequest/,
    /sendBeacon/,
    /localStorage/,
    /sessionStorage/,
    /indexedDB/,
    /WebSocket/,
    /EventSource/,
    /location\.(?:search|hash)/
  ]) {
    assert.doesNotMatch(entry, forbidden);
  }
});
