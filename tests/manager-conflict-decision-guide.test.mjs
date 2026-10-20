import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('trabajo/mi-jefe-me-hace-la-vida-imposible/index.html', 'utf8');
const sitemap = readFileSync('sitemap.xml', 'utf8');

test('manager conflict guide separates organization, hostility and possible harassment without diagnosing', () => {
  for (const signal of ['Conflicto o mala relación', 'Mala organización o mando', 'Conductas hostiles o violentas', 'Posible acoso psicológico']) {
    assert.match(html, new RegExp(signal, 'i'), signal);
  }
  assert.match(html, /no bastan para emitir aquí una conclusión jurídica/i);
});

test('manager conflict guide supports factual records while limiting collection and protecting privacy', () => {
  for (const signal of ['Fecha y contexto', 'Conducta concreta', 'Personas presentes', 'Petición y respuesta', 'acceso legítimo']) {
    assert.match(html, new RegExp(signal, 'i'), signal);
  }
  assert.match(html, /No accedas a cuentas ajenas/i);
  assert.match(html, /No obtengas información mediante accesos ajenos/i);
  assert.match(html, /aepd\.es\/guias\/la-proteccion-de-datos-en-las-relaciones-laborales\.pdf/i);
});

test('manager conflict guide distinguishes routes and limits the discrimination service scope', () => {
  assert.match(html, /denuncia formal, previa identificación/i);
  assert.match(html, /buzón.+forma anónima/is);
  assert.match(html, /Son vías diferentes/i);
  assert.match(html, /específicamente frente a discriminación racial o étnica/i);
  assert.match(html, /No es un canal general para todos los conflictos laborales/i);
});

test('manager conflict guide keeps crisis help non-commercial and avoids unsupported review claims', () => {
  assert.match(html, /href="\/buscar\/"/i);
  assert.match(html, /No consta revisión individual por un profesional externo/i);
  assert.doesNotMatch(html, /href="\/#inicio"/i);
  assert.doesNotMatch(html, /adsbygoogle|affiliate|visitor-analytics|contratación garantizada/i);
});

test('manager conflict guide metadata and sitemap share the real modification date', () => {
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-20"/);
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/trabajo\/mi-jefe-me-hace-la-vida-imposible\/"/);
  assert.match(sitemap, /mi-jefe-me-hace-la-vida-imposible\/<\/loc><lastmod>2026-10-20<\/lastmod>/);
});
