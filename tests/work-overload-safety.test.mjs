import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../trabajo/no-puedo-mas-en-el-trabajo/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('la guía separa causas laborales antes de psicologizar el problema', () => {
  assert.match(html, /<strong>Carga\.<\/strong>/i);
  assert.match(html, /<strong>Control\.<\/strong>/i);
  assert.match(html, /<strong>Relaciones y trato\.<\/strong>/i);
  assert.match(html, /<strong>Recuperación\.<\/strong>/i);
  assert.match(html, /<strong>Dependencia económica\.<\/strong>/i);
  assert.match(html, /una dificultad organizativa no debería convertirse automáticamente en un supuesto fallo personal/i);
});

test('burnout se presenta con frontera no diagnóstica y fuente OMS', () => {
  assert.match(html, /fenómeno ocupacional/i);
  assert.match(html, /no como una condición médica/i);
  assert.match(html, /una página web no puede diagnosticarte/i);
  assert.match(html, /who\.int\/standards\/classifications\/frequently-asked-questions\/burn-out-an-occupational-phenomenon/i);
});

test('la guía prioriza causas organizativas y no prescribe dimisión impulsiva', () => {
  assert.match(html, /medidas sobre la organización y las condiciones de trabajo deben tener prioridad/i);
  assert.match(html, /no estás ante un peligro inmediato/i);
  assert.match(html, /No firmes algo que no entiendes/i);
  assert.match(html, /orientación preventiva, sindical, laboral o jurídica/i);
});

test('el carril crítico conserva 112 y 024 y explicita límites del servicio', () => {
  assert.match(html, /tel:112/);
  assert.match(html, /tel:024/);
  assert.match(html, /pensando en hacerte daño/i);
  assert.match(html, /no somos un servicio de emergencias ni ofrecemos supervisión continua/i);
});

test('canonical, fecha editorial y lastmod permanecen sincronizados', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/trabajo\/no-puedo-mas-en-el-trabajo\/"/);
  assert.match(html, /Actualizado el 1 de septiembre de 2026/i);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/trabajo\/no-puedo-mas-en-el-trabajo\/<\/loc><lastmod>2026-09-01<\/lastmod>/);
});
