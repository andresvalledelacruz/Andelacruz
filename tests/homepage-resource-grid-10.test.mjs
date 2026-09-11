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

const expectedOrder = [
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

test('la primera vista de Recursos declara exactamente diez rutas autorizadas', () => {
  for (const [label, href] of expected) {
    assert.ok(script.includes(`['${label}', '${href}']`), `Falta ${label} -> ${href}`);
  }

  const routesBlock = script.match(/const routes = new Map\(\[([\s\S]*?)\]\);/)?.[1] ?? '';
  assert.equal([...routesBlock.matchAll(/^\s*\['/gm)].length, 10);
});

test('Recursos respeta el orden de prioridad aprobado para lanzamiento', () => {
  const orderBlock = script.match(/const RESOURCE_ORDER = \[([\s\S]*?)\];/)?.[1] ?? '';
  const actualOrder = [...orderBlock.matchAll(/'([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(actualOrder, expectedOrder);
  assert.match(script, /resourceGrid\.append\(found\.node\)/);
});

test('la tarjeta de suicidio conserva tratamiento P0 y deriva a ayuda urgente', () => {
  assert.ok(script.includes("['Suicidio', '/ayuda-urgente.html']"));
  assert.match(script, /\['Suicidio', \{[^\n]*safety: 'P0'/);
  assert.match(script, /Ver ayuda ahora/);
});
