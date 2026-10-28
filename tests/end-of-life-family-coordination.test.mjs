import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../duelo/mi-familiar-se-esta-muriendo-y-no-se-que-hacer/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('la guía mantiene el pronóstico y los cambios clínicos en el equipo asistencial', () => {
  assert.match(page, /No intentes adivinar por tu cuenta cuánto tiempo queda/i);
  assert.match(page, /Desgracias\.es no puede determinar por síntomas aislados/i);
  assert.match(page, /no uses la hoja para interpretar síntomas o modificar medicación/i);
  assert.match(page, /no sustituye el plan de cuidados/i);
});

test('la guía ofrece coordinación privada y limitada a las próximas 24 horas', () => {
  assert.match(page, /Una hoja privada para coordinar las próximas 24 horas/i);
  assert.match(page, /Lo confirmado por el equipo/i);
  assert.match(page, /Preguntas pendientes/i);
  assert.match(page, /Preferencias de la persona/i);
  assert.match(page, /Tarea, responsable y confirmación/i);
  assert.match(page, /Próxima revisión/i);
  assert.match(page, /El silencio no equivale a aceptar una tarea ni a consentir una decisión/i);
});

test('la guía respeta autonomía, representación y límites familiares', () => {
  assert.match(page, /No conviertas una opinión familiar en su voluntad/i);
  assert.match(page, /no da autoridad para decidir por los demás/i);
  assert.match(page, /no deduzcas la capacidad ni la legitimación de nadie/i);
  assert.match(page, /instrucciones previas, preferencias manifestadas y representación/i);
});

test('la guía protege intimidad, menores y elimina la captación de relatos', () => {
  assert.match(page, /no debe circular por grupos amplios/i);
  assert.match(page, /No grabes conversaciones clínicas, fotografías o momentos íntimos/i);
  assert.match(page, /Tampoco uses a menores como mensajeros/i);
  assert.doesNotMatch(page, /Contar mi historia/i);
  assert.doesNotMatch(page, /href="\/#inicio"/i);
  assert.match(page, /href="\/buscar\/"/i);
});

test('la página mantiene metadatos, fuentes locales y fecha editorial alineada', () => {
  assert.match(page, /Actualizado el 28 de octubre de 2026/);
  assert.match(page, /"@type":"WebPage"/);
  assert.match(page, /"dateModified":"2026-10-28"/);
  assert.match(page, /href="\/assets\/home-fonts\.css"/i);
  assert.match(page, /src="\/public-page-runtime\.js" defer/i);
  assert.doesNotMatch(page, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);
  assert.match(page, /portal\.guiasalud\.es\/guia-en-capas\/gpc_612__atencion_paliativa_sud-2\//i);
  assert.match(
    sitemap,
    /<loc>https:\/\/desgracias\.es\/duelo\/mi-familiar-se-esta-muriendo-y-no-se-que-hacer\/<\/loc><lastmod>2026-10-28<\/lastmod>/
  );
});
