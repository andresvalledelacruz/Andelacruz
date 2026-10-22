import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../familia/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('el hub ofrece un mapa de decisión y separa cinco planos familiares', () => {
  assert.match(html, /Un mapa de decisión para las próximas 48 horas/i);
  for (const plane of ['Relación', 'Convivencia', 'Cuidados', 'Dinero y vivienda', 'Protección']) {
    assert.match(html, new RegExp(`<strong>${plane}\\.<\\/strong>`, 'i'));
  }
  assert.match(html, /Define un objetivo pequeño/i);
  assert.match(html, /Fija revisión/i);
});

test('la mediación queda limitada a participación voluntaria y segura', () => {
  assert.match(html, /ambas partes quieren negociar y existe un contexto seguro/i);
  assert.match(html, /No decide quién tiene razón, no garantiza un pacto/i);
  assert.match(html, /no es un primer paso prudente si existe violencia, coacción, miedo a represalias/i);
});

test('cuidados, menores y dependencia se tratan sin prometer prestaciones', () => {
  assert.match(html, /Sistema para la Autonomía y Atención a la Dependencia/i);
  assert.match(html, /no debe darse por concedida/i);
  assert.match(html, /No los uses como mensajeros, árbitros o fuente de información/i);
  assert.match(html, /No les pidas que elijan bando/i);
});

test('sustituye captación por búsqueda privada y conserva exclusión comercial', () => {
  assert.doesNotMatch(html, /Contar mi historia/i);
  assert.doesNotMatch(html, /href="\/#inicio"/i);
  assert.match(html, /href="\/buscar\/"/i);
  assert.match(html, /sin introducir nombres, documentos, direcciones ni datos de otras personas/i);
  assert.doesNotMatch(html, /awin|adtraction|financeads|adsense|afiliad|publicidad/i);
});

test('enlaza fuentes públicas primarias para mediación, servicios, cuidados y 016', () => {
  assert.match(html, /e-justice\.europa\.eu\/topics\/taking-legal-action\/mediation\/family-mediation/i);
  assert.match(html, /dsca\.gob\.es\/sites\/default\/files\/derechos-sociales\/CatalogoReferencia\.pdf/i);
  assert.match(html, /imserso\.es\/autonomia-personal-dependencia\/sistema-autonomia-atencion-dependencia-saad/i);
  assert.match(html, /violenciagenero\.igualdad\.gob\.es\/informacion-3\/recursos\/telefono016/i);
});

test('canonical, datos estructurados, fecha visible y sitemap quedan alineados', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/familia\/"/);
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-22"/);
  assert.match(html, /Actualizado el 22 de octubre de 2026/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/familia\/<\/loc><lastmod>2026-10-22<\/lastmod>/);
});
