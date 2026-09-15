import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const loader = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const entry = fs.readFileSync(new URL('../search-home-entry.js', import.meta.url), 'utf8');
const homepage = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('homepage serves search discovery natively and does not load the legacy injector', () => {
  assert.doesNotMatch(loader, /load\('\/search-home-entry\.js'\)/);
  assert.match(loader, /load\('\/visitor-analytics\.js'\)/);
  for (const location of ['main-nav', 'hero', 'needs', 'footer']) {
    assert.match(homepage, new RegExp(`data-search-entry="${location}"`));
  }
});

test('header urgent-help control remains available and receives visible launch emphasis', () => {
  assert.match(homepage, /class="urgent-help-link"[^>]+href="\/ayuda-urgente\.html"/);
  assert.match(homepage, /aria-label="Necesito Ayuda Urgente"/);
  assert.match(homepage, /data-urgent-help-emphasis/);
  assert.match(homepage, /background:#8A4939/);
  assert.match(homepage, /focus-visible/);
});

test('urgent help is centered in the hero and needs decision grids', () => {
  assert.match(homepage, /class="final-card final-card-primary"[^>]+href="\/ayuda-urgente\.html"[^>]+data-urgent-entry="hero"/);
  assert.match(homepage, /<strong>Necesito ayuda urgente<\/strong>/);
  assert.match(homepage, /Si hay peligro inmediato o no sabes qué hacer ahora\./);
  assert.match(homepage, /href="\/ayuda-urgente\.html" data-urgent-entry="needs"/);
  assert.match(homepage, /Ver ayuda urgente/);
});

test('search orienter remains discoverable in four homepage locations with distinct copy', () => {
  assert.match(homepage, /data-search-entry="main-nav"[^>]*>Buscar ayuda<\/a>/);
  assert.match(homepage, /data-search-entry="hero"/);
  assert.match(homepage, /<strong>PARA AYUDARTE MEJOR<\/strong>/);
  assert.match(homepage, /<small>cuéntame qué te pasa<\/small>/);
  assert.match(homepage, /data-search-entry="needs"[^>]*>Encontrar por dónde empezar/);
  assert.match(homepage, /data-search-entry="footer"[^>]*>Buscar ayuda<\/a>/);
});

test('urgent help remains available in footer navigation alongside search', () => {
  const urgentIndex = homepage.indexOf('data-urgent-entry="footer"');
  const searchIndex = homepage.indexOf('data-search-entry="footer"');
  assert.ok(urgentIndex >= 0, 'urgent footer entry must exist');
  assert.ok(searchIndex > urgentIndex, 'urgent footer entry remains before search');
});

test('integration reuses V9 components instead of replacing homepage structure', () => {
  assert.match(homepage, /class="hero-final-actions"/);
  assert.match(homepage, /<h3>Busco orientación<\/h3>/);
  assert.match(homepage, /id="main-nav"/);
});

test('legacy discovery adapter remains local and inert for rollback', () => {
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
  assert.doesNotMatch(loader, /load\('\/urgent-help-nav\.js'\)/);
  assert.doesNotMatch(loader, /load\('\/resource-links\.js'\)/);
});
