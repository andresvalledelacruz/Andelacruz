import test from 'node:test';
import assert from 'node:assert/strict';
import { isCriticalRoutePath } from '../scripts/critical-route-signals.mjs';

const criticalRoutes = [
  'me-preocupa-que-alguien-pueda-suicidarse/index.html',
  'he-sufrido-una-agresion-sexual-y-no-se-que-hacer/index.html',
  'mi-pareja-me-maltrata-y-no-se-que-hacer/index.html',
  'violencia-en-casa/index.html',
  'ayuda-urgente.html',
  'sobredosis/index.html',
  'abstinencia-grave/index.html',
  'trata/index.html',
  'trata-de-personas/index.html',
  'coaccion/index.html',
  'secuestro/index.html',
  'desahucio-inminente/index.html',
  'sin-hogar/index.html',
  'persona-vulnerable/index.html',
  'menor-en-riesgo/index.html',
  'desastre-activo/index.html',
  'catastrofe/index.html',
];

const nonCriticalRoutes = [
  'trabajo/hago-entrevistas-pero-no-me-contratan/index.html',
  'trabajo/contratacion/index.html',
  'salud/tratamiento-general/index.html',
  'familia/retrato-familiar/index.html',
  'dinero/como-organizar-mis-gastos/index.html',
];

test('detecta todas las señales críticas explícitas', () => {
  for (const route of criticalRoutes) {
    assert.equal(isCriticalRoutePath(route), true, route);
  }
});

test('no convierte subcadenas inocuas en rutas P0/P1', () => {
  for (const route of nonCriticalRoutes) {
    assert.equal(isCriticalRoutePath(route), false, route);
  }
});
