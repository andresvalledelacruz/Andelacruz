import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../trabajo-dinero/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('el hub combinado conserva identidad, fecha y descubrimiento', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/trabajo-dinero\/"/);
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-24"/);
  assert.match(html, /Actualizado el 24 de octubre de 2026/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/trabajo-dinero\/<\/loc><lastmod>2026-10-24<\/lastmod>/);
});

test('distingue urgencia, flujo económico y transición laboral', () => {
  for (const copy of [
    'Un mapa de decisión para las próximas 48 horas',
    'Separa tres capas que suelen mezclarse',
    'Antes de dejar un empleo',
    'Antes de asumir una nueva deuda',
    'Si el ingreso no cubre lo esencial',
    'País, contrato e idioma son cosas distintas'
  ]) assert.match(html, new RegExp(copy, 'i'));
  assert.match(html, /una acción reversible/i);
  assert.match(html, /no cuentes una ayuda, indemnización u oferta hasta verificar/i);
});

test('protege privacidad, crisis y ausencia de captación o comercio', () => {
  assert.match(html, /No envíes a Desgracias\.es/i);
  assert.match(html, /href="tel:112"/);
  assert.match(html, /href="tel:024"/);
  assert.match(html, /sanidad\.gob\.es\/linea024/i);
  assert.match(html, /<script src="\/public-page-runtime\.js" async><\/script>/);
  assert.doesNotMatch(html, /Contar mi historia|Cuéntanos tu historia|<form\b|adsbygoogle|awin|adtraction|financeads|solicita presupuesto|contrata ahora/i);
});

test('cita fuentes públicas y declara límites', () => {
  assert.match(html, /insst\.es\/materias\/riesgos\/riesgos-psicosociales/);
  assert.match(html, /sepe\.es\/HomeSepe/);
  assert.match(html, /clientebancario\.bde\.es/);
  assert.match(html, /seg-social\.es/);
  assert.match(html, /no decide derechos/i);
  assert.match(html, /No consta revisión laboral, financiera, jurídica o clínica individual externa/i);
});
