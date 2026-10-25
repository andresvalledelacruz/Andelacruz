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
  assert.match(html, /medidas organizativas y colectivas frente a depender únicamente de actuaciones individuales/i);
  assert.match(html, /no sustituye corregir una exposición mantenida/i);
  assert.match(html, /Responsable u organización/i);
  assert.match(html, /Servicio de prevención/i);
});

test('la guía distingue salud, prevención e incapacidad temporal', () => {
  assert.match(html, /Salud, prevención e incapacidad temporal son circuitos relacionados, no idénticos/i);
  assert.match(html, /Solo el circuito competente puede emitir la baja, confirmación o alta/i);
  assert.match(html, /no decide una baja médica/i);
  assert.match(html, /prestaciones\.seg-social\.es\/prestaciones-enfermedades-accidentes\/incapacidad-temporal\.html/i);
});

test('la guía propone documentación mínima, petición comprobable y canales distintos', () => {
  assert.match(html, /Expediente mínimo sin convertirte en investigador/i);
  assert.match(html, /No entres en cuentas ajenas/i);
  assert.match(html, /Una comunicación al buzón y una denuncia formal no son necesariamente lo mismo/i);
  assert.match(html, /Convierte «no puedo más» en una petición comprobable/i);
});

test('la salida laboral evita equivalencias y decisiones sin información', () => {
  assert.match(html, /Salir puede ser adecuado/i);
  assert.match(html, /no son equivalentes/i);
  assert.match(html, /Consulta antes de firmar/i);
  assert.match(html, /puede afectar plazos, prestación y reclamaciones/i);
});

test('el carril crítico conserva 112 y 024 y explicita límites del servicio', () => {
  assert.match(html, /tel:112/);
  assert.match(html, /tel:024/);
  assert.match(html, /pensando en hacerte daño/i);
  assert.match(html, /no es un servicio de emergencias ni ofrece supervisión continua/i);
});

test('canonical, fecha editorial y lastmod permanecen sincronizados', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/trabajo\/no-puedo-mas-en-el-trabajo\/"/);
  assert.match(html, /Fuentes oficiales revisadas el 25 de octubre de 2026/i);
  assert.match(html, /"dateModified":"2026-10-25"/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/trabajo\/no-puedo-mas-en-el-trabajo\/<\/loc><lastmod>2026-10-25<\/lastmod>/);
});
