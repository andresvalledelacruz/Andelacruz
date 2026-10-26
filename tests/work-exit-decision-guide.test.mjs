import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('trabajo/odio-mi-trabajo-pero-no-puedo-dejarlo/index.html', 'utf8');
const sitemap = readFileSync('sitemap.xml', 'utf8');

test('work exit guide separates repair, prevention, possible violations and transition', () => {
  for (const signal of ['Desajuste reparable', 'Desgaste organizativo', 'Posible incumplimiento o vulneración', 'Final de etapa']) {
    assert.match(html, new RegExp(signal, 'i'), signal);
  }
  assert.match(html, /No todos se resuelven con resiliencia individual/i);
});

test('work exit guide provides a decision log, financial scenarios and exit threshold', () => {
  for (const signal of ['mapa de decisión en cuatro columnas', 'hechos de interpretaciones', 'tres escenarios', 'umbral de salida']) {
    assert.match(html, new RegExp(signal, 'i'), signal);
  }
  assert.match(html, /evita guardar tu único registro en un dispositivo o cuenta de trabajo/i);
});

test('work exit guide turns the first 72 hours into reversible, privacy-preserving steps', () => {
  for (const signal of ['plan de 72 horas', 'En 24 horas', 'En 48 horas', 'En 72 horas', 'treinta días']) {
    assert.match(html, new RegExp(signal, 'i'), signal);
  }
  assert.match(html, /No copies bases de datos, secretos empresariales ni datos personales/i);
  assert.match(html, /evita comunicar una decisión irreversible/i);
});

test('work exit guide compares offers and separates non-equivalent exit routes', () => {
  for (const signal of ['Vínculo y fechas', 'Dinero neto y costes', 'Tiempo real', 'Riesgo de transición']) {
    assert.match(html, new RegExp(signal, 'i'), signal);
  }
  assert.match(html, /Una salida no se reduce a “seguir” o “dimitir”/i);
  assert.match(html, /ni están disponibles en todos los casos/i);
  assert.match(html, /cuentas y dispositivos personales/i);
});

test('work exit guide distinguishes resignation from legal and prevention routes', () => {
  assert.match(html, /una baja voluntaria no da acceso inmediato/i);
  assert.match(html, /Una dimisión ordinaria no es lo mismo que solicitar judicialmente la extinción/i);
  assert.match(html, /artículo 50/i);
  assert.match(html, /procedimiento formal de denuncia y de un buzón.+no son el mismo canal/is);
  assert.match(html, /boe\.es\/buscar\/act\.php\?id=BOE-A-2015-11430/i);
  assert.match(html, /insst\.es\/materias\/riesgos\/riesgos-psicosociales/i);
});

test('work exit guide keeps sensitive help non-commercial and avoids unsupported review claims', () => {
  assert.match(html, /href="\/buscar\/"/i);
  assert.match(html, /No consta revisión individual por un profesional externo/i);
  assert.doesNotMatch(html, /href="\/#inicio"/i);
  assert.doesNotMatch(html, /adsbygoogle|affiliate|visitor-analytics|contratación garantizada/i);
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);
  assert.match(html, /<script src="\/public-page-runtime\.js"><\/script>/i);
});

test('work exit guide metadata and sitemap share the real modification date', () => {
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-26"/);
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/trabajo\/odio-mi-trabajo-pero-no-puedo-dejarlo\/"/);
  assert.match(sitemap, /odio-mi-trabajo-pero-no-puedo-dejarlo\/<\/loc><lastmod>2026-10-26<\/lastmod>/);
});
