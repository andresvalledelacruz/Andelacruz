import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL_OPPORTUNITY_MAP } from '../opportunity/url-map.mjs';

const route = '/duelo/no-pude-despedirme/';
const page = await readFile(new URL('../duelo/no-pude-despedirme/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
const ctx = URL_OPPORTUNITY_MAP[route];

test('unfinished farewell guide remains a medium-risk grief route without diagnosis', () => {
  assert.ok(ctx);
  assert.equal(ctx.domain, 'grief');
  assert.equal(ctx.risk, 'medium');
  assert.match(page, /no diagnostica duelo prolongado, trauma, depresión u otros trastornos/i);
  assert.match(page, /no sustituye atención sanitaria, psicológica o de emergencia/i);
});

test('seven-day map separates facts, wishes and uncertainty', () => {
  assert.match(page, /Un mapa privado y reversible para los próximos siete días/i);
  assert.match(page, /qué ocurrió y sabes/i);
  assert.match(page, /qué te habría gustado que ocurriera/i);
  assert.match(page, /qué no puedes comprobar/i);
  assert.match(page, /acción privada y reversible/i);
  assert.match(page, /El objetivo no es sentir que todo está cerrado/i);
  assert.match(page, /No conviertas este registro en una investigación interminable/i);
});

test('farewell options remain optional and observable rather than prescriptive', () => {
  assert.match(page, /Una despedida simbólica es una opción, no una obligación/i);
  assert.match(page, /No hacer nada todavía/i);
  assert.match(page, /puedes esperar/i);
  assert.match(page, /si puedes recordar más partes de la relación, descansar algo mejor o volver a una tarea cotidiana/i);
});

test('privacy guidance prevents unnecessary publication of shared memories', () => {
  assert.match(page, /Antes de publicar una despedida, protege la intimidad compartida/i);
  assert.match(page, /menores, otras personas, información sanitaria, mensajes privados, direcciones/i);
  assert.match(page, /borrar una publicación no elimina necesariamente las copias/i);
  assert.match(page, /aepd\.es\/areas-de-actuacion\/internet-y-redes-sociales\/protege-tu-privacidad/i);
  assert.doesNotMatch(page, /Contar mi historia/i);
  assert.doesNotMatch(page, /href="\/#inicio"/i);
  assert.match(page, /Busca un siguiente paso sin publicar tu historia/i);
  assert.match(page, /href="\/buscar\/"/i);
});

test('urgent routing remains explicit and correctly scoped', () => {
  assert.match(page, /href="tel:112"/i);
  assert.match(page, /href="tel:024"/i);
  assert.match(page, /servicio nacional, gratuito, confidencial y disponible las 24 horas/i);
  assert.match(page, /Desgracias\.es no es un servicio de emergencias/i);
});

test('metadata, local assets and sitemap stay aligned', () => {
  assert.match(page, /\"@type\":\"WebPage\"/);
  assert.match(page, /\"dateModified\":\"2026-10-28\"/);
  assert.match(page, /Actualizado el 28 de octubre de 2026/i);
  assert.match(page, /href="\/assets\/home-fonts\.css"/i);
  assert.match(page, /src="\/public-page-runtime\.js" defer/i);
  assert.doesNotMatch(page, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/duelo\/no-pude-despedirme\/<\/loc><lastmod>2026-10-28<\/lastmod>/i);
});
