import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('app.js', 'utf8');
const adapter = readFileSync('resource-links.js', 'utf8');

test('la portada carga el adaptador de enlaces de Recursos', () => {
  assert.match(app, /load\('\/resource-links\.js'\)/);
});

test('Duelo y pérdidas enlaza al hub público de duelo', () => {
  assert.match(adapter, /\['Duelo y pérdidas', '\/duelo\/'\]/);
});

test('Rupturas y relaciones enlaza al hub público de rupturas', () => {
  assert.match(adapter, /\['Rupturas y relaciones', '\/rupturas\/'\]/);
});

test('las tarjetas con destino muestran una pista visible de navegación', () => {
  assert.match(adapter, /cue\.textContent = 'Ver recursos →'/);
  assert.match(adapter, /cue\.dataset\.resourceLinkCue = ''/);
  assert.match(adapter, /article\.append\(cue\)/);
});

test('Gestión emocional no recibe un destino aproximado y se marca como en preparación', () => {
  assert.match(adapter, /Gestión emocional/);
  assert.match(adapter, /status\.textContent = 'En preparación'/);
  assert.doesNotMatch(adapter, /\['Gestión emocional',\s*'\/(?:soledad|duelo|rupturas)\//);
});
