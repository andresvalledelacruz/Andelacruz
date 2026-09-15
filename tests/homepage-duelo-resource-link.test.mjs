import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('app.js', 'utf8');
const homepage = readFileSync('index.html', 'utf8');
const adapter = readFileSync('resource-links.js', 'utf8');

test('la portada sirve los enlaces de Recursos desde HTML estático', () => {
  assert.doesNotMatch(app, /load\('\/resource-links\.js'\)/);
  assert.match(homepage, /href="\/duelo\/"[^>]*aria-label="Ver recursos de Duelo y pérdidas"/);
  assert.match(homepage, /href="\/rupturas\/"[^>]*aria-label="Ver recursos de Rupturas y relaciones"/);
  assert.match(homepage, /href="\/gestion-emocional\/"[^>]*aria-label="Ver recursos de Gestión emocional"/);
});

test('Duelo y pérdidas enlaza al hub público de duelo', () => {
  assert.match(homepage, /href="\/duelo\/"[\s\S]*?<h3>Duelo y pérdidas<\/h3>/);
});

test('Rupturas y relaciones enlaza al hub público de rupturas', () => {
  assert.match(homepage, /href="\/rupturas\/"[\s\S]*?<h3>Rupturas y relaciones<\/h3>/);
});

test('Gestión emocional enlaza solo a su hub público específico', () => {
  assert.match(homepage, /href="\/gestion-emocional\/"[\s\S]*?<h3>Gestión emocional<\/h3>/);
  assert.doesNotMatch(homepage, /href="\/(?:soledad|duelo|rupturas)\/"[^>]*aria-label="Ver recursos de Gestión emocional"/);
});

test('las tarjetas con destino muestran una pista visible de navegación', () => {
  assert.ok((homepage.match(/data-resource-link-cue=""/g) || []).length >= 10);
  assert.match(homepage, /Ver recursos →/);
  assert.match(homepage, /Ver ayuda ahora →/);
});

test('el adaptador legacy queda disponible solo para rollback y conserva las rutas aprobadas', () => {
  assert.match(adapter, /\['Duelo y pérdidas', '\/duelo\/'\]/);
  assert.match(adapter, /\['Gestión emocional', '\/gestion-emocional\/'\]/);
});
