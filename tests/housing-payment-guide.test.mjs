import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dinero/no-puedo-pagar-la-vivienda/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
const inventory = await readFile(new URL('../SAFETY_ROUTE_INVENTORY.md', import.meta.url), 'utf8');

test('separa alquiler, hipoteca y fase documental', () => {
  for (const text of ['Triaje para hoy y mañana', 'Separa alquiler e hipoteca', 'burofax', 'demanda, citación o lanzamiento', 'prueba de la fecha de recepción']) assert.match(html, new RegExp(text, 'i'));
});

test('no mantiene la prórroga derogada de 2026', () => {
  assert.match(html, /No existe una pausa automática para cualquier desahucio en 2026/i);
  assert.match(html, /ambas fueron derogadas/i);
  assert.match(html, /texto consolidado.*31 de diciembre de 2025/i);
  assert.doesNotMatch(html, /En 2026 existe una suspensión extraordinaria/i);
});

test('distingue negociación y defensa procesal sin prometer resultados', () => {
  for (const text of ['El pago aún no ha vencido', 'Existe uno o más atrasos', 'Has recibido un burofax o requerimiento', 'Hay demanda, citación o lanzamiento']) assert.match(html, new RegExp(text, 'i'));
  assert.match(html, /No negocies como única estrategia/i);
});

test('explica el Código de Buenas Prácticas dentro de sus límites', () => {
  assert.match(html, /medidas sucesivas/i);
  assert.match(html, /No es automático ni equivale a una condonación general/i);
  assert.match(html, /reestructuración.*plazo.*coste total.*avalistas/is);
});

test('incluye presupuesto resistente, asistencia jurídica y fraude', () => {
  for (const text of ['Mes ordinario', 'Mes caro', 'Ingreso reducido', 'asistencia jurídica gratuita', 'parar cualquier desahucio']) assert.match(html, new RegExp(text, 'i'));
});

test('protege crisis, violencia, privacidad y comercio', () => {
  assert.match(html, /href="tel:112"/i);
  assert.match(html, /href="tel:024"/i);
  assert.match(html, /href="\/violencia\/"/i);
  assert.match(html, /no solicita contratos, escritos judiciales, DNI/i);
  assert.doesNotMatch(html, /Contar mi historia|Cuéntanos tu historia|<form\b|adsbygoogle|awin|adtraction|financeads|affiliate-link/i);
});

test('usa fuentes oficiales y declara límites', () => {
  for (const host of ['clientebancario.bde.es', 'www.boe.es', 'www.mjusticia.gob.es', 'www.sanidad.gob.es']) assert.match(html, new RegExp(host.replaceAll('.', '\\.')));
  assert.match(html, /No consta revisión jurídica externa individual/i);
  assert.match(html, /sin publicidad, afiliación, captación/i);
});

test('incorpora la ruta al inventario Safety', () => {
  assert.match(inventory, /\| `\/dinero\/no-puedo-pagar-la-vivienda\/` \|/);
  assert.match(inventory, /riesgo habitacional.*112 \+ 024/i);
});

test('sincroniza canonical, WebPage, fecha y sitemap', () => {
  const url = 'https://desgracias.es/dinero/no-puedo-pagar-la-vivienda/';
  assert.match(html, new RegExp('rel="canonical" href="' + url.replaceAll('/', '\\/') + '"'));
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-23"/);
  assert.match(html, /Actualizado el 23 de octubre de 2026/);
  assert.match(sitemap, new RegExp('<loc>' + url.replaceAll('/', '\\/') + '<\\/loc><lastmod>2026-10-23<\\/lastmod>'));
});
