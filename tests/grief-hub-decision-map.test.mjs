import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../duelo/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('the grief hub offers an actionable 72-hour decision map', () => {
  assert.match(html, /mapa de decisión para las próximas 72 horas/i);
  assert.match(html, /Necesidades básicas/i);
  assert.match(html, /Menores y personas dependientes/i);
  assert.match(html, /vuelve a mirar la lista en 48 o 72 horas/i);
});

test('practical guidance separates official procedures, privacy, and authority', () => {
  assert.match(html, /Papeles y gestiones sin hacerlo todo de golpe/i);
  assert.match(html, /certificado de defunción acredita oficialmente/i);
  assert.match(html, /Privacidad, pertenencias y legado digital/i);
  assert.match(html, /sin autorización legítima/i);
  assert.match(html, /sede\.mjusticia\.gob\.es\/es\/tramites\/certificado-defuncion/i);
});

test('children and dependants receive non-clinical, age-aware guidance', () => {
  assert.match(html, /palabras comprensibles y honestas/i);
  assert.match(html, /Un menor no debe convertirse en mensajero/i);
  assert.match(html, /salud, educación o servicios sociales/i);
});

test('the hub keeps safety precedence and avoids rigid grief stages', () => {
  assert.match(html, /href="tel:112"/);
  assert.match(html, /href="tel:024"/);
  assert.match(html, /No necesitas pasar por “cinco etapas”/i);
  assert.match(html, /No hace falta esperar a cumplir un plazo ni asumir un diagnóstico/i);
});

test('the private search replaces the legacy story CTA without commerce', () => {
  assert.match(html, /href="\/buscar\/">Buscar ayuda por situación/);
  assert.doesNotMatch(html, /href="\/#inicio"/);
  assert.doesNotMatch(html, /afiliad|anuncio|publicidad|préstamo/i);
});

test('metadata and sitemap identify the reviewed edition', () => {
  assert.match(html, /"inLanguage":"es-ES"/);
  assert.match(html, /"dateModified":"2026-10-24"/);
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/duelo\/"/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/duelo\/<\/loc><lastmod>2026-10-24<\/lastmod>/);
});
