import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html = readFileSync('trabajo/index.html', 'utf8');
const sitemap = readFileSync('sitemap.xml', 'utf8');

test('el hub laboral conserva identidad, fecha y descubrimiento', () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/desgracias\.es\/trabajo\/">/);
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-22"/);
  assert.match(html, /Actualizado el 22 de octubre de 2026/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/trabajo\/<\/loc><lastmod>2026-10-22<\/lastmod>/);
});

test('el hub distingue búsqueda, empleo actual y vías de apoyo', () => {
  for (const copy of ['Un mapa de decisión para las próximas 48 horas', 'Qué recurso encaja con cada barrera', 'Riesgos psicosociales: no reducirlo todo a resiliencia individual', 'Orientación pública antes de comprar una solución', 'Conflicto, incumplimiento o riesgo: separar vías']) assert.match(html, new RegExp(copy, 'i'));
  assert.match(html, /vacantes pertinentes, candidaturas adaptadas, respuestas, entrevistas y ofertas/i);
  assert.match(html, /no promete contratación/i);
});

test('el hub conserva Safety y elimina captación y comercio', () => {
  assert.match(html, /href="tel:112"/);
  assert.match(html, /href="tel:024"/);
  assert.match(html, /Buscar ayuda por situación/i);
  assert.doesNotMatch(html, /Contar mi historia/i);
  assert.doesNotMatch(html, /afiliad|publicidad|patrocin|data-ad|utm_/i);
});

test('el hub cita fuentes públicas sin simular asesoramiento individual', () => {
  assert.match(html, /insst\.es\/materias\/riesgos\/riesgos-psicosociales/);
  assert.match(html, /sepe\.es\/HomeSepe/);
  assert.match(html, /mites\.gob\.es\/itss/);
  assert.match(html, /no decide derechos individuales/i);
});
