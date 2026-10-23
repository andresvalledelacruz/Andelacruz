import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dinero/no-llego-a-fin-de-mes/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('distingue las causas del desfase y ofrece un mapa inmediato', () => {
  for (const text of ['Mapa de decisión para las próximas 48 horas', 'Desfase de fechas', 'Gasto extraordinario', 'Cuotas de deuda', 'Déficit estructural']) {
    assert.match(html, new RegExp(text, 'i'));
  }
  assert.match(html, /No todo déficit es un fallo de voluntad/i);
});

test('usa presupuestos resistentes y ordena por consecuencias', () => {
  for (const text of ['Mes ordinario', 'Mes caro', 'Ingreso reducido', 'Ordena por consecuencias']) {
    assert.match(html, new RegExp(text, 'i'));
  }
  assert.match(html, /no establece prioridades jurídicas individuales/i);
  assert.match(html, /no garantiza seguridad/i);
});

test('explica apoyo público sin prometer acceso', () => {
  assert.match(html, /Servicios sociales municipales/i);
  assert.match(html, /href="tel:020"/i);
  assert.match(html, /Cumplir una estimación no equivale a una concesión/i);
  assert.match(html, /No pagues a alguien por “garantizar” una ayuda pública/i);
});

test('protege datos y separa violencia y crisis', () => {
  assert.match(html, /no necesita recibir extractos, contratos, DNI/i);
  assert.match(html, /href="\/violencia\/"/i);
  assert.match(html, /href="tel:112"/i);
  assert.match(html, /href="tel:024"/i);
  assert.doesNotMatch(html, /Contar mi historia|Cuéntanos tu historia|<form\b/i);
});

test('mantiene la guía completamente no comercial', () => {
  assert.doesNotMatch(html, /adsbygoogle|awin|adtraction|financeads|data-affiliate|affiliate-link/i);
  assert.match(html, /sin publicidad, afiliación, formularios de leads/i);
  assert.match(html, /No recomienda productos, entidades o intermediarios/i);
});

test('usa fuentes oficiales y declara límites internacionales', () => {
  for (const host of ['clientebancario.bde.es', 'www.seg-social.es', 'administracion.gob.es', 'www.sanidad.gob.es']) {
    assert.match(html, new RegExp(host.replaceAll('.', '\\.')));
  }
  assert.match(html, /Atención en español no significa jurisdicción española/i);
  assert.match(html, /No consta revisión financiera o jurídica individual externa/i);
});

test('sincroniza canonical, WebPage, fecha visible y sitemap', () => {
  const url = 'https://desgracias.es/dinero/no-llego-a-fin-de-mes/';
  assert.match(html, new RegExp('rel="canonical" href="' + url.replaceAll('/', '\\/') + '"'));
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-23"/);
  assert.match(html, /Actualizado el 23 de octubre de 2026/);
  assert.match(sitemap, new RegExp('<loc>' + url.replaceAll('/', '\\/') + '<\\/loc><lastmod>2026-10-23<\\/lastmod>'));
});
