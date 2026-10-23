import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('profesionales.html', 'utf8');
const sitemap = readFileSync('sitemap.xml', 'utf8');

test('France guidance uses official profession-specific sources', () => {
  assert.match(html, /id="francia"/i);
  assert.match(html, /annuaire\.esante\.gouv\.fr/i);
  assert.match(html, /esante\.gouv\.fr\/produits-services\/annuaire-sante/i);
  assert.match(html, /cnb\.avocat\.fr\/annuaire-des-avocats-de-france/i);
  assert.match(html, /identidad.+profesión declarada.+cualificación.+situación de ejercicio.+lugar de establecimiento.+territorio del servicio/is);
  assert.match(html, /no deducir de un número que toda especialidad, modalidad o prestación transfronteriza esté validada/i);
});

test('Portugal guidance separates registration, profession and specialty', () => {
  assert.match(html, /id="portugal"/i);
  assert.match(html, /ordemdospsicologos\.pt\/pt\/membros/i);
  assert.match(html, /ordemdosmedicos\.pt\/area-medica\/inscricoes/i);
  assert.match(html, /portal\.oa\.pt\/advogados\/pesquisa-de-advogados/i);
  assert.match(html, /título de médico.+colegio de especialidad/is);
  assert.match(html, /no asumirá que una colegiación extranjera cubre un encargo portugués/i);
});

test('country expansion preserves verification and commercial boundaries', () => {
  assert.match(html, /idiomas de atención como dato de accesibilidad, no como credencial/i);
  assert.match(html, /la revisión queda pendiente; no se completa con una suposición/i);
  assert.match(html, /Una coincidencia registral no evalúa la calidad, disponibilidad o idoneidad/i);
  assert.match(html, /El directorio de profesionales todavía no está disponible/i);
  assert.doesNotMatch(html, /profesional recomendado|alta garantizada|resultado garantizado/i);
});

test('professional metadata and sitemap reflect the editorial update', () => {
  assert.match(html, /"dateModified":"2026-10-22"/i);
  assert.match(html, /Contenido editorial actualizado el 22 de octubre de 2026/i);
  assert.match(sitemap, /profesionales\.html<\/loc><lastmod>2026-10-22<\/lastmod>/i);
});
