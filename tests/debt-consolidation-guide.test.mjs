import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pagePath = '../dinero/quiero-reunificar-mis-deudas/index.html';
const html = await readFile(new URL(pagePath, import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('separa el problema antes de presentar la reunificación', () => {
  for (const text of ['Organización', 'Falta de margen temporal', 'Déficit estructural', 'Insolvencia o ejecuciones']) {
    assert.match(html, new RegExp(text, 'i'));
  }
  for (const text of ['Mantener y priorizar', 'Renegociar por separado', 'Reunificar', 'Asesoramiento sobre insolvencia']) {
    assert.match(html, new RegExp(text, 'i'));
  }
});

test('compara cuota, coste y riesgo con escenarios resistentes', () => {
  for (const text of ['capital total nuevo', 'importe total adeudado', 'honorarios de intermediación', 'nuevas garantías']) {
    assert.match(html, new RegExp(text, 'i'));
  }
  for (const text of ['Mes ordinario', 'Mes caro', 'Ingreso reducido']) assert.match(html, new RegExp(text, 'i'));
  assert.match(html, /no garantiza seguridad/i);
});

test('explica intermediación y riesgo hipotecario sin recomendar operadores', () => {
  assert.match(html, /separa intermediario y prestamista/i);
  assert.match(html, /Banco de España o a la comunidad autónoma/i);
  assert.match(html, /Convertir deuda personal en deuda hipotecaria cambia el riesgo/i);
  assert.match(html, /Ley 2\/2009/i);
  assert.doesNotMatch(html, /comparador patrocinado|entidad recomendada|solicita ahora/i);
});

test('limita la segunda oportunidad y la contratación internacional', () => {
  assert.match(html, /no es un producto financiero ni un borrado automático/i);
  assert.match(html, /plan de pagos o liquidación/i);
  assert.match(html, /idioma no equivale a jurisdicción/i);
  assert.match(html, /No los extrapoles a cualquier operación/i);
});

test('protege datos, elimina captación y mantiene la ruta de crisis', () => {
  assert.match(html, /No entregues claves, códigos de un solo uso ni acceso remoto/i);
  assert.match(html, /no solicita presupuestos, contratos ni datos bancarios/i);
  assert.doesNotMatch(html, /Contar mi historia|Cuéntanos tu historia|<form\b/i);
  assert.doesNotMatch(html, /adsbygoogle|awin|adtraction|financeads|data-affiliate|affiliate-link/i);
  assert.match(html, /href="tel:112"/i);
  assert.match(html, /href="tel:024"/i);
});

test('usa fuentes primarias y explicita límites editoriales', () => {
  for (const host of ['clientebancario.bde.es', 'www.boe.es', 'commission.europa.eu', 'www.sanidad.gob.es']) {
    assert.match(html, new RegExp(host.replaceAll('.', '\\.')));
  }
  assert.match(html, /No consta revisión financiera o jurídica individual externa/i);
  assert.match(html, /sin publicidad, afiliación, formularios de leads/i);
});

test('sincroniza canonical, WebPage, fecha visible y sitemap', () => {
  const url = 'https://desgracias.es/dinero/quiero-reunificar-mis-deudas/';
  assert.match(html, new RegExp(`rel="canonical" href="${url.replaceAll('/', '\\/')}"`));
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-23"/);
  assert.match(html, /Actualizado el 23 de octubre de 2026/);
  assert.match(sitemap, new RegExp(`<loc>${url.replaceAll('/', '\\/')}<\\/loc><lastmod>2026-10-23<\\/lastmod>`));
});
