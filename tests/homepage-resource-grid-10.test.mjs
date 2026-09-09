import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const script = await readFile(new URL('../resource-links.js', import.meta.url), 'utf8');

const expected = [
  ['Gestión emocional', '/gestion-emocional/'],
  ['Rupturas y relaciones', '/rupturas/'],
  ['Familia', '/familia/'],
  ['Trabajo y dinero', '/trabajo-dinero/'],
  ['Duelo y pérdidas', '/duelo/'],
  ['Soledad', '/soledad/'],
  ['Ansiedad y desbordamiento', '/ansiedad/'],
  ['Salud y enfermedad', '/salud/'],
  ['Violencia, abuso y acoso', '/violencia/'],
  ['Suicidio', '/ayuda-urgente.html']
];

test('la primera vista de Recursos declara exactamente diez rutas autorizadas', () => {
  for (const [label, href] of expected) {
    assert.ok(script.includes(`label: '${label}'`), `Falta la tarjeta ${label}`);
    assert.ok(script.includes(`href: '${href}'`), `Falta la ruta ${href}`);
  }

  const declaredResources = [...script.matchAll(/\{ label: '/g)];
  assert.equal(declaredResources.length, 10);
});

test('la tarjeta de suicidio conserva tratamiento P0 y deriva a ayuda urgente', () => {
  assert.match(script, /label: 'Suicidio',[\s\S]*href: '\/ayuda-urgente\.html'[\s\S]*safety: 'P0'/);
  assert.match(script, /Ver ayuda ahora/);
});
