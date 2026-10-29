import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pagePath = new URL('../duelo/he-perdido-a-mi-bebe-durante-el-embarazo/index.html', import.meta.url);
const sitemapPath = new URL('../sitemap.xml', import.meta.url);
const html = fs.readFileSync(pagePath, 'utf8');

test('keeps medical interpretation and treatment with the care team', () => {
  assert.match(html, /La causa de una pérdida gestacional es una cuestión médica/);
  assert.match(html, /No cambies medicación, tratamiento ni seguimiento/);
  assert.match(html, /no interpreta síntomas, no indica tratamiento/i);
});

test('offers a bounded private 48-hour plan', () => {
  for (const marker of [
    'Una hoja privada para las próximas 48 horas',
    'Lo confirmado por el equipo sanitario',
    'Preguntas pendientes',
    'Necesidad inmediata',
    'Decisiones que necesitan tiempo',
    'Próximo punto de revisión',
  ]) assert.ok(html.includes(marker), `missing ${marker}`);
  assert.match(html, /No es una historia clínica ni sirve para interpretar síntomas/);
});

test('preserves autonomy and does not universalize memories or coverage', () => {
  assert.match(html, /Son opciones, no requisitos universales/);
  assert.match(html, /pueden depender del centro y de las circunstancias/);
  assert.match(html, /Acompañar no equivale a decidir por ella/);
  assert.match(html, /Conservar o no recuerdos no demuestra cuánto querías/);
});

test('protects medical and third-party privacy without sensitive capture', () => {
  for (const marker of ['ecografías', 'informes', 'resultados', 'mensajes clínicos', 'pareja', 'otros hijos']) {
    assert.ok(html.includes(marker), `missing ${marker}`);
  }
  assert.match(html, /no los conviertas en mensajeros entre adultos/);
  assert.doesNotMatch(html, /Contar mi historia|href="\/#inicio"/);
  assert.doesNotMatch(html, /adsbygoogle|awin|adtraction|financeads|affiliate/i);
});

test('publishes coherent metadata, local fonts, runtime and sitemap date', () => {
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-28"/);
  assert.match(html, /href="\/assets\/home-fonts\.css"/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(html, /src="\/public-page-runtime\.js" defer/);
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  assert.match(sitemap, /he-perdido-a-mi-bebe-durante-el-embarazo\/<\/loc><lastmod>2026-10-28<\/lastmod>/);
});
