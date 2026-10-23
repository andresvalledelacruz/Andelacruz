import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dinero/necesito-dinero-urgente/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
const inventory = await readFile(new URL('../SAFETY_ROUTE_INVENTORY.md', import.meta.url), 'utf8');

test('triajea la urgencia antes de presentar financiación', () => {
  for (const text of ['Triaje para las próximas dos horas', 'Necesidad básica hoy', 'Vivienda o suministro', 'Pago con plazo formal', 'Gasto que mantiene ingresos', 'Gasto aplazable', 'Déficit que se repite']) {
    assert.match(html, new RegExp(text, 'i'));
  }
  assert.match(html, /Rapidez no significa bajo riesgo/i);
});

test('reduce fecha, importe y forma antes de una cuota nueva', () => {
  for (const text of ['Fecha', 'Importe', 'Forma de resolverlo', 'Mes ordinario', 'Mes caro', 'Ingreso reducido']) assert.match(html, new RegExp(text, 'i'));
  assert.match(html, /cadena potencial de deuda/i);
});

test('compara coste, identidad y datos sin recomendar operadores', () => {
  for (const text of ['dinero que recibirás realmente', 'TAE', 'coste total', 'identidad del prestamista', 'uso y cesión de tus datos']) assert.match(html, new RegExp(text, 'i'));
  assert.match(html, /distingue comparador, intermediario, prestamista y cobrador/i);
  assert.doesNotMatch(html, /entidad recomendada|solicita ahora|aprobación asegurada/i);
});

test('limita correctamente desistimiento y alcance internacional', () => {
  assert.match(html, /catorce días naturales dentro de su ámbito/i);
  assert.match(html, /Desistir no significa conservar gratis el dinero/i);
  assert.match(html, /Idioma, país y jurisdicción son datos distintos/i);
  assert.match(html, /No traslades automáticamente plazos/i);
});

test('protege datos, elimina captación y mantiene crisis', () => {
  assert.match(html, /no solicita DNI, contratos, extractos/i);
  assert.doesNotMatch(html, /Contar mi historia|Cuéntanos tu historia|<form\b/i);
  assert.doesNotMatch(html, /adsbygoogle|awin|adtraction|financeads|data-affiliate|affiliate-link/i);
  assert.match(html, /href="tel:112"/i);
  assert.match(html, /href="tel:024"/i);
  assert.match(html, /href="\/violencia\/"/i);
});

test('usa fuentes primarias y declara límites editoriales', () => {
  for (const host of ['clientebancario.bde.es', 'www.boe.es', 'portal-cec.consumo.gob.es', 'administracion.gob.es', 'www.sanidad.gob.es']) {
    assert.match(html, new RegExp(host.replaceAll('.', '\\.')));
  }
  assert.match(html, /No consta revisión financiera o jurídica individual externa/i);
  assert.match(html, /sin publicidad, captación, formularios de leads/i);
});

test('incorpora la ruta al inventario Safety protegido', () => {
  assert.match(inventory, /\| `\/dinero\/necesito-dinero-urgente\/` \|/);
  assert.match(inventory, /urgencia económica.*112 \+ 024/i);
});

test('sincroniza canonical, WebPage, fecha visible y sitemap', () => {
  const url = 'https://desgracias.es/dinero/necesito-dinero-urgente/';
  assert.match(html, new RegExp('rel="canonical" href="' + url.replaceAll('/', '\\/') + '"'));
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-23"/);
  assert.match(html, /Actualizado el 23 de octubre de 2026/);
  assert.match(sitemap, new RegExp('<loc>' + url.replaceAll('/', '\\/') + '<\\/loc><lastmod>2026-10-23<\\/lastmod>'));
});
