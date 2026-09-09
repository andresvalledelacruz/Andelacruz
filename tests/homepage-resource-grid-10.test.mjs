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
    assert.ok(script.includes(`['${label}', '${href}']`), `Falta ${label} -> ${href}`);
  }

  const routesBlock = script.match(/const routes = new Map\(\[([\s\S]*?)\]\);/)?.[1] ?? '';
  assert.equal([...routesBlock.matchAll(/^\s*\['/gm)].length, 10);
});

test('la tarjeta de suicidio conserva tratamiento P0 y deriva a ayuda urgente', () => {
  assert.ok(script.includes("['Suicidio', '/ayuda-urgente.html']"));
  assert.match(script, /\['Suicidio', \{[^\n]*safety: 'P0'/);
  assert.match(script, /Ver ayuda ahora/);
});
