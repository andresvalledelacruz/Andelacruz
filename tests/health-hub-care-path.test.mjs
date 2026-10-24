import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../salud/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('health hub offers a non-diagnostic 24-hour continuity map', () => {
  assert.match(html, /mapa para las próximas 24 horas/i);
  assert.match(html, /No sirve para decidir un diagnóstico ni la gravedad/i);
  assert.match(html, /Identifica el contacto asistencial/i);
  assert.match(html, /siguiente paso verificable/i);
});

test('consultation guidance separates observations from interpretation', () => {
  assert.match(html, /preparar información sin autodiagnosticarse/i);
  assert.match(html, /cronología observable/i);
  assert.match(html, /Antes de salir: comprobar que existe continuidad/i);
  assert.match(html, /repetir con tus palabras lo que has entendido/i);
});

test('waiting guidance avoids remote triage and treatment changes', () => {
  assert.match(html, /Mientras esperas una prueba o un resultado/i);
  assert.match(html, /un resultado necesita contexto clínico/i);
  assert.match(html, /no suspendas tratamientos, compres productos ni cambies dosis/i);
  assert.match(html, /esta página no puede decidir si debe adelantarse una atención/i);
});

test('medication information uses official sources', () => {
  assert.match(html, /Medicamentos: una lista útil y una fuente oficial/i);
  assert.match(html, /cima\.aemps\.es\/cima\/publico\/home\.html/i);
  assert.match(html, /seguridaddelpaciente\.sanidad\.gob\.es\/practicasSeguras\/usoSeguroMedicamentos/i);
});

test('caregiving and privacy preserve consent and authority', () => {
  assert.match(html, /qué información autoriza compartir/i);
  assert.match(html, /no concede automáticamente acceso a su historia/i);
  assert.match(html, /no lo sustituyas por contraseñas compartidas/i);
  assert.match(html, /No incluyas nombres, documentos, números de historia/i);
});

test('safety remains prominent and the hub contains no commercial route', () => {
  assert.match(html, /href="tel:112"/);
  assert.match(html, /Desgracias\.es no es un servicio sanitario ni de emergencias/i);
  assert.match(html, /href="\/buscar\/">Buscar ayuda por situación/);
  assert.doesNotMatch(html, /afiliad|publicidad|anuncio|préstamo/i);
});

test('metadata and sitemap identify the reviewed health edition', () => {
  assert.match(html, /"inLanguage":"es-ES"/);
  assert.match(html, /"dateModified":"2026-10-24"/);
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/salud\/"/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/salud\/<\/loc><lastmod>2026-10-24<\/lastmod>/);
});
