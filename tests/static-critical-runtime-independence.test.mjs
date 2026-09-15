import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const appJs = await readFile(new URL('../app.js', import.meta.url), 'utf8');

const expectedResources = [
  'Suicidio',
  'Violencia, abuso y acoso',
  'Duelo y pérdidas',
  'Ansiedad y desbordamiento',
  'Gestión emocional',
  'Soledad',
  'Salud y enfermedad',
  'Trabajo y dinero',
  'Rupturas y relaciones',
  'Familia'
];

test('critical launch navigation exists in static homepage HTML', () => {
  assert.match(indexHtml, /class="urgent-help-link"[^>]+href="\/ayuda-urgente\.html"/);
  assert.match(indexHtml, /href="\/buscar\/" data-search-entry="main-nav"/);
  assert.match(indexHtml, /href="\/buscar\/" data-search-entry="hero"/);
  assert.match(indexHtml, /href="\/ayuda-urgente\.html" data-urgent-entry="hero"/);
  assert.match(indexHtml, /href="\/ayuda-urgente\.html" data-urgent-entry="footer"/);
});

test('all ten launch resource doors exist in static homepage HTML', () => {
  for (const label of expectedResources) {
    assert.ok(indexHtml.includes(`<h3>${label}</h3>`), `Missing static resource: ${label}`);
  }
});

test('runtime loader no longer downloads legacy DOM injectors', () => {
  assert.doesNotMatch(appJs, /search-home-entry\.js/);
  assert.doesNotMatch(appJs, /resource-links\.js/);
  assert.doesNotMatch(appJs, /urgent-help-nav\.js/);
});

test('runtime has privacy-safe global failure handling and core fallback', () => {
  assert.match(appJs, /addEventListener\('error'/);
  assert.match(appJs, /addEventListener\('unhandledrejection'/);
  assert.match(appJs, /installCoreFallback/);
  assert.match(appJs, /submit\.disabled=true/);
  assert.match(appJs, /Buscar ayuda, Recursos y Ayuda urgente/);
});
