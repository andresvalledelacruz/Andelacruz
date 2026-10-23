import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pagePath = '../dinero/necesito-un-prestamo-pero-no-se-si-puedo-permitirmelo/index.html';
const html = await readFile(new URL(pagePath, import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('separa necesidad, capacidad y comparación antes de contratar', () => {
  for (const text of ['Compra planificada', 'Imprevisto necesario', 'Déficit mensual', 'Otra deuda']) assert.match(html, new RegExp(text, 'i'));
  for (const text of ['Mes ordinario', 'Mes caro', 'Ingreso reducido']) assert.match(html, new RegExp(text, 'i'));
  assert.match(html, /no garantiza que la cuota sea compatible/i);
});

test('compara el coste completo sin convertir un porcentaje en recomendación', () => {
  for (const text of ['TAE', 'coste total', 'servicios vinculados', 'Garantía o aval', 'Reembolso anticipado']) assert.match(html, new RegExp(text, 'i'));
  assert.match(html, /No es un objetivo ni una garantía de seguridad/i);
  assert.match(html, /mismo importe y el mismo plazo/i);
});

test('limita correctamente derechos y contratación internacional', () => {
  assert.match(html, /Ley 16\/2011/i);
  assert.match(html, /14 días naturales/i);
  assert.match(html, /No supongas que esas reglas cubren cualquier préstamo/i);
  assert.match(html, /país de residencia, país del prestamista, moneda, jurisdicción/i);
});

test('previene fraude, filtración de datos y captación comercial', () => {
  assert.match(html, /No entregues claves, códigos de un solo uso ni acceso remoto/i);
  assert.match(html, /No envíes DNI, contratos, nóminas, números completos de cuenta o tarjetas/i);
  assert.doesNotMatch(html, /Contar mi historia|Cuéntanos tu historia|<form\b/i);
  assert.doesNotMatch(html, /adsbygoogle|awin|adtraction|financeads|data-affiliate|affiliate-link/i);
  assert.match(html, /no solicita presupuestos/i);
  assert.match(html, /no contiene publicidad, afiliación ni formularios de leads/i);
});

test('mantiene crisis, límites editoriales y fuentes públicas', () => {
  assert.match(html, /href="tel:112"/i);
  assert.match(html, /href="tel:024"/i);
  assert.match(html, /no consta revisión financiera o jurídica individual externa/i);
  for (const host of ['clientebancario.bde.es', 'www.boe.es', 'commission.europa.eu', 'www.finanzasparatodos.es']) assert.match(html, new RegExp(host.replaceAll('.', '\\.')));
});

test('sincroniza canonical, WebPage, fecha visible y sitemap', () => {
  const url = 'https://desgracias.es/dinero/necesito-un-prestamo-pero-no-se-si-puedo-permitirmelo/';
  assert.match(html, new RegExp(`rel="canonical" href="${url.replaceAll('/', '\\/')}"`));
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-23"/);
  assert.match(html, /Actualizado el 23 de octubre de 2026/);
  assert.match(sitemap, new RegExp(`<loc>${url.replaceAll('/', '\\/')}<\\/loc><lastmod>2026-10-23<\\/lastmod>`));
});
