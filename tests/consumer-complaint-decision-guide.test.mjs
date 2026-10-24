import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html = readFileSync('reclamar-una-compra/index.html', 'utf8');
const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('separa las intenciones principales antes de recomendar una vía', () => {
  for (const phrase of ['No ha llegado o no han prestado el servicio','Es defectuoso o no coincide con lo anunciado','Quiero devolver una compra a distancia','No reconozco el cargo','La empresa no responde']) assert.match(text, new RegExp(phrase, 'i'));
});

test('distingue pago no autorizado de compra autorizada incumplida', () => {
  assert.match(text, /una compra autorizada que no llega.*no necesariamente.*autorización del pago/i);
  assert.match(text, /la devolución no está garantizada/i);
  assert.match(text, /Si no lo autorizaste, avisa al banco cuanto antes/i);
});

test('explica garantía y desistimiento sin prometer resultados', () => {
  assert.match(text, /garantía legal de tres años/i);
  assert.match(text, /no inferior a un año/i);
  assert.match(text, /catorce días naturales/i);
  assert.match(text, /existen excepciones/i);
  assert.match(text, /no promete que una reclamación, devolución o arbitraje prospere/i);
});

test('describe arbitraje y reclamación transfronteriza con fuentes oficiales', () => {
  assert.match(text, /Si la empresa no está adherida, puede aceptar el arbitraje/i);
  assert.match(text, /la decisión vincula a las partes/i);
  assert.match(text, /otro país de la UE, Islandia, Noruega o Reino Unido/i);
  assert.match(html, /consumo\.gob\.es\/es\/consumo\/como-reclamar-conflicto-consumo\/sistema-arbitral-consumo\/tramitacion/);
  assert.match(html, /portal-cec\.consumo\.gob\.es\/es\/consultas-y-reclamaciones\/enviar-reclamacion/);
  assert.match(html, /clientebancario\.bde\.es/);
});

test('protege datos y mantiene fuera integraciones comerciales no aprobadas', () => {
  assert.match(text, /No publiques facturas, direcciones, firmas, claves, códigos ni números completos de tarjeta/i);
  assert.match(text, /No introduzcas nombres, números de pedido, datos bancarios ni documentos/i);
  assert.doesNotMatch(html, /adsbygoogle|awin|adtraction|financeads|affiliate|lead-form|solicita presupuesto/i);
});

test('publica metadatos y lastmod exactos para la URL canónica', () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/desgracias\.es\/reclamar-una-compra\/">/);
  assert.match(html, /"dateModified":"2026-10-24"/);
  const sitemap = readFileSync('sitemap.xml', 'utf8');
  const entries = [...sitemap.matchAll(/<url><loc>https:\/\/desgracias\.es\/reclamar-una-compra\/<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g)];
  assert.equal(entries.length, 1);
  assert.equal(entries[0][1], '2026-10-24');
});
