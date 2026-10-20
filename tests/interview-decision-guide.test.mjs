import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const path = 'trabajo/hago-entrevistas-pero-no-me-contratan/index.html';
const html = readFileSync(path, 'utf8');
const sitemap = readFileSync('sitemap.xml', 'utf8');

test('interview guide diagnoses the selection stage before changing the whole profile', () => {
  for (const signal of ['Primera llamada', 'Primera entrevista', 'Prueba técnica o caso', 'Fase final', 'Oferta que no aceptas', 'tres procesos similares']) {
    assert.match(html, new RegExp(signal, 'i'), signal);
  }
  assert.match(html, /No rehagas el CV si el CV ya consigue entrevistas/i);
});

test('interview guide covers evidence, conditions, remote preparation and privacy', () => {
  for (const signal of ['Prepara evidencia', 'salario y condiciones', 'Si la entrevista es remota', 'Privacidad, fraude y posible discriminación', 'No facilites claves, códigos de verificación, datos bancarios ni pagos']) {
    assert.match(html, new RegExp(signal, 'i'), signal);
  }
  assert.match(html, /aepd\.es\/guias\/la-proteccion-de-datos-en-las-relaciones-laborales\.pdf/i);
  assert.match(html, /eures\.europa\.eu\/do-you-have-virtual-job-interview/i);
});

test('interview guide avoids guarantees and routes to published non-commercial help', () => {
  assert.match(html, /no garantiza contratación/i);
  assert.match(html, /Desconfía de garantías de contratación/i);
  assert.match(html, /href="\/buscar\/"/i);
  assert.doesNotMatch(html, /href="\/#inicio"/i);
  assert.doesNotMatch(html, /adsbygoogle|affiliate|visitor-analytics/i);
});

test('interview guide metadata and sitemap share the real modification date', () => {
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-20"/);
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/trabajo\/hago-entrevistas-pero-no-me-contratan\/"/);
  assert.match(sitemap, /hago-entrevistas-pero-no-me-contratan\/<\/loc><lastmod>2026-10-20<\/lastmod>/);
});
