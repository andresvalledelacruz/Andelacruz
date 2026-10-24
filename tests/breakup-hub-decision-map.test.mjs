import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../rupturas/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('el hub ofrece un mapa de 72 horas y separa cinco planos', () => {
  assert.match(html, /Un mapa de decisión para las próximas 72 horas/i);
  for (const plane of ['Seguridad', 'Contacto emocional', 'Hijos y cuidados', 'Vivienda y dinero', 'Privacidad digital']) {
    assert.match(html, new RegExp(`<strong>${plane}\\.<\\/strong>`, 'i'));
  }
  assert.match(html, /Separa emoción y gestión/i);
  assert.match(html, /Elige una revisión concreta/i);
});

test('el contacto se limita sin fomentar acoso ni saltarse un bloqueo', () => {
  assert.match(html, /una comprobación de dos minutos/i);
  assert.match(html, /No uses cuentas nuevas, terceras personas o llamadas repetidas para saltarte un bloqueo/i);
  assert.match(html, /La urgencia que sientes no obliga a la otra persona a responder/i);
});

test('hijos, vivienda y dinero quedan separados del conflicto emocional', () => {
  assert.match(html, /Los menores no deben convertirse en mensajeros, árbitros ni fuente de información/i);
  assert.match(html, /Reunir datos no equivale a aceptar un acuerdo ni a renunciar a derechos/i);
  assert.match(html, /confirma la información con el organismo o profesional competente/i);
});

test('la privacidad digital limita acceso y contempla monitorización', () => {
  assert.match(html, /solo en cuentas a las que tengas acceso legítimo/i);
  assert.match(html, /No accedas a cuentas ajenas ni borres información de otra persona/i);
  assert.match(html, /Si sospechas que el móvil está monitorizado/i);
  assert.match(html, /href="tel:017"/i);
});

test('sustituye captación por búsqueda privada y conserva exclusión comercial', () => {
  assert.doesNotMatch(html, /Contar mi historia/i);
  assert.doesNotMatch(html, /href="\/#inicio"/i);
  assert.match(html, /href="\/buscar\/"/i);
  assert.match(html, /sin introducir nombres, direcciones, documentos, capturas ni datos de otras personas/i);
  assert.doesNotMatch(html, /awin|adtraction|financeads|adsense|afiliad|publicidad/i);
});

test('conserva emergencia y enlaza fuentes públicas primarias', () => {
  for (const phone of ['112', '024', '016', '017']) assert.match(html, new RegExp(`href="tel:${phone}"`));
  assert.match(html, /violenciagenero\.igualdad\.gob\.es\/informacion-3\/recursos\/telefono016/i);
  assert.match(html, /incibe\.es\/ciudadania\/blog\/que-hacer-si-sospecho-que-estan-monitorizando-mi-movil/i);
  assert.match(html, /Desgracias\.es no es un servicio de emergencias/i);
});

test('canonical, fecha visible, datos estructurados y sitemap quedan alineados', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/rupturas\/"/);
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-24"/);
  assert.match(html, /Actualizado el 24 de octubre de 2026/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/rupturas\/<\/loc><lastmod>2026-10-24<\/lastmod>/);
});
