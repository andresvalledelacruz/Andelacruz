import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../duelo/la-muerte-fue-inesperada-o-traumatica/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('separa duelo por la persona del impacto por cómo ocurrió', () => {
  assert.match(html, /dos capas pueden mezclarse/i);
  assert.match(html, /dolor por la persona/i);
  assert.match(html, /impacto de cómo ocurrió/i);
});

test('distingue hechos, inferencias e imágenes mentales', () => {
  assert.match(html, /hechos confirmados/i);
  assert.match(html, /inferencias/i);
  assert.match(html, /imágenes mentales/i);
});

test('evita sobrediagnóstico y exposición repetitiva', () => {
  assert.match(html, /no permite concluir automáticamente que tengas un trastorno/i);
  assert.match(html, /no necesitas exponerte una y otra vez/i);
  assert.match(html, /no diagnostica trauma, trastorno de estrés postraumático, duelo prolongado, depresión/i);
});

test('mantiene urgencia y límite de servicio', () => {
  assert.match(html, /tel:112/);
  assert.match(html, /tel:024/);
  assert.match(html, /Desgracias\.es no es un servicio de emergencias/i);
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/duelo\/la-muerte-fue-inesperada-o-traumatica\/"/);
});

test('ofrece un mapa privado y acotado sin reconstruir responsabilidades', () => {
  assert.match(html, /Un mapa privado para las próximas 72 horas/i);
  assert.match(html, /Hecho confirmado/i);
  assert.match(html, /Efecto actual/i);
  assert.match(html, /Necesidad inmediata/i);
  assert.match(html, /Una acción y una persona responsable/i);
  assert.match(html, /Próxima revisión/i);
  assert.match(html, /Una cronología incompleta no demuestra causalidad, negligencia ni responsabilidad/i);
  assert.match(html, /no le autoriza a decidir por ti, acceder a tus cuentas ni difundir documentos/i);
});

test('protege intimidad, menores y sustituye captación por búsqueda privada', () => {
  assert.match(html, /Protege la intimidad mientras intentas entender lo ocurrido/i);
  assert.match(html, /fotografías, vídeos, informes, atestados, conversaciones/i);
  assert.match(html, /No pidas a menores que repitan escenas/i);
  assert.match(html, /Haber recibido una imagen o un relato no implica permiso para reenviarlo/i);
  assert.doesNotMatch(html, /Contar mi historia/i);
  assert.doesNotMatch(html, /href="\/#inicio"/i);
  assert.match(html, /href="\/buscar\/"/i);
});

test('mantiene metadatos, recursos locales y fecha editorial sincronizada', () => {
  assert.match(html, /Actualizado el 28 de octubre de 2026/);
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-28"/);
  assert.match(html, /href="\/assets\/home-fonts\.css"/i);
  assert.match(html, /src="\/public-page-runtime\.js" defer/i);
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);
  assert.match(html, /sanidad\.gob\.es\/gl\/ciudadanos\/saludMental\/autoayuda\.htm/i);
  assert.match(html, /aepd\.es\/preguntas-frecuentes\/0-conceptos-basicos\/FAQ-0011/i);
  assert.match(
    sitemap,
    /<loc>https:\/\/desgracias\.es\/duelo\/la-muerte-fue-inesperada-o-traumatica\/<\/loc><lastmod>2026-10-28<\/lastmod>/
  );
});
