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

test('homepage entry layer exposes urgent help before search in navigation', () => {
  assert.match(entry, /const URGENT_URL = '\/ayuda-urgente\.html'/);
  assert.match(entry, /dataset\.urgentEntry = 'main-nav'/);
  assert.match(entry, /textContent = 'Ayuda urgente'/);
  assert.match(entry, /insertAfter\(firstLink, urgent\)/);
  assert.match(entry, /insertAfter\(urgent, search\)/);
});

test('urgent help is promoted as the first hero action and first needs option', () => {
  assert.match(entry, /dataset\.urgentEntry = 'hero'/);
  assert.match(entry, /title\.textContent = 'Necesito ayuda urgente'/);
  assert.match(entry, /description\.textContent = 'Si hay peligro inmediato o no sabes qué hacer ahora\.'/);
  assert.match(entry, /dataset\.urgentEntry = 'needs'/);
  assert.match(entry, /heading\.textContent = 'Necesito ayuda urgente'/);
  assert.match(entry, /Ver ayuda urgente/);
  assert.match(entry, /storyButton\.replaceWith\(card\)/);
});

test('search orienter remains discoverable in four homepage locations', () => {
  assert.match(entry, /dataset\.searchEntry = 'main-nav'/);
  assert.match(entry, /dataset\.searchEntry = 'hero'/);
  assert.match(entry, /dataset\.searchEntry = 'needs'/);
  assert.match(entry, /dataset\.searchEntry = 'footer'/);
  assert.ok((entry.match(/href = SEARCH_URL/g) || []).length >= 4);
  assert.match(entry, /Buscar ayuda/);
  assert.match(entry, /Cuéntame qué te pasa/);
  assert.match(entry, /Encontrar por dónde empezar/);
});

test('urgent help is also available in footer navigation', () => {
  assert.match(entry, /dataset\.urgentEntry = 'footer'/);
  assert.match(entry, /navigation\.insertBefore\(urgent, existingSearch\)/);
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

test('homepage discovery layer does not introduce network, storage or query propagation', () => {
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
