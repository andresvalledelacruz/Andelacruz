import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL_OPPORTUNITY_MAP } from '../opportunity/url-map.mjs';

const route = '/duelo/quiero-ayudar-a-alguien-que-esta-de-duelo/';
const page = await readFile(new URL('../duelo/quiero-ayudar-a-alguien-que-esta-de-duelo/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
const ctx = URL_OPPORTUNITY_MAP[route];

test('grief supporter guide remains non-diagnostic and preserves safety routing', () => {
  assert.ok(ctx);
  assert.equal(ctx.domain, 'grief');
  assert.equal(ctx.risk, 'medium');
  assert.match(page, /no permite diagnosticar a una persona a partir de su duelo/i);
  assert.match(page, /no sustituye atención sanitaria, psicológica o de emergencia/i);
  assert.match(page, /href="tel:112"/i);
  assert.match(page, /href="tel:024"/i);
  assert.match(page, /Desgracias\.es no es un servicio de emergencias/i);
});

test('seven-day plan requires consent, minimum disclosure and observable review', () => {
  assert.match(page, /Un plan de apoyo consentido para los próximos siete días/i);
  assert.match(page, /Pregunta antes de actuar/i);
  assert.match(page, /Conserva su control/i);
  assert.match(page, /No pidas contraseñas ni accedas a cuentas, mensajes, documentos, datos sanitarios o dinero/i);
  assert.match(page, /Coordina solo lo necesario/i);
  assert.match(page, /Revisa hechos observables/i);
  assert.match(page, /No midas el éxito por que parezca más animada/i);
});

test('support does not expose another persons story or restart story capture', () => {
  assert.match(page, /Ayudar no te autoriza a compartir su historia/i);
  assert.match(page, /fotografías y los datos de familiares o menores no se vuelven públicos/i);
  assert.match(page, /comparte la información mínima/i);
  assert.match(page, /borrarlo no elimina las copias/i);
  assert.match(page, /aepd\.es\/areas-de-actuacion\/internet-y-redes-sociales\/protege-tu-privacidad/i);
  assert.doesNotMatch(page, /Contar mi situación/i);
  assert.doesNotMatch(page, /href="\/#inicio"/i);
  assert.match(page, /Busca un siguiente paso sin publicar la historia de otra persona/i);
  assert.match(page, /href="\/buscar\/"/i);
});

test('metadata, local assets and sitemap stay aligned', () => {
  assert.match(page, /\"@type\":\"WebPage\"/);
  assert.match(page, /\"dateModified\":\"2026-10-28\"/);
  assert.match(page, /Actualizado el 28 de octubre de 2026/i);
  assert.match(page, /href="\/assets\/home-fonts\.css"/i);
  assert.match(page, /src="\/public-page-runtime\.js" defer/i);
  assert.doesNotMatch(page, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/duelo\/quiero-ayudar-a-alguien-que-esta-de-duelo\/<\/loc><lastmod>2026-10-28<\/lastmod>/i);
});
