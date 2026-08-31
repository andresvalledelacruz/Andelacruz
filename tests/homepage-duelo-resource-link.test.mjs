import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('app.js', 'utf8');
const adapter = readFileSync('resource-links.js', 'utf8');

test('la portada carga el adaptador de enlaces de Recursos', () => {
  assert.match(app, /load\('\/resource-links\.js'\)/);
});

test('Duelo y pérdidas enlaza al hub público de duelo sin alterar el HTML V9', () => {
  assert.match(adapter, /Duelo y pérdidas/);
  assert.match(adapter, /link\.href = '\/duelo\/'/);
  assert.match(adapter, /aria-label', 'Ver recursos de Duelo y pérdidas'/);
});
