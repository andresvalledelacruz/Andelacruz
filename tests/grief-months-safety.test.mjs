import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../duelo/han-pasado-meses-y-sigo-muy-mal/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('months-later grief guide avoids calendar diagnosis and rigid recovery rules', () => {
  assert.match(page, /no hay una fecha en la que debas estar bien/i);
  assert.match(page, /un solo día malo no define la trayectoria/i);
  assert.match(page, /Una web no puede diagnosticar duelo prolongado/i);
  assert.match(page, /no se reduce a contar meses/i);
});

test('months-later grief guide evaluates function, context and social pressure without invalidating grief', () => {
  assert.match(page, /funcionar no significa dejar de echar de menos/i);
  assert.match(page, /presión del entorno/i);
  assert.match(page, /sueño/i);
  assert.match(page, /alimentación/i);
  assert.match(page, /trabajo o estudio/i);
  assert.match(page, /aislamiento/i);
});

test('months-later grief guide preserves urgent 112 and 024 routing', () => {
  assert.match(page, /peligro inmediato/i);
  assert.match(page, /href="tel:112"/);
  assert.match(page, /href="tel:024"/);
  assert.match(page, /servicio nacional, gratuito, confidencial y disponible las 24 horas/i);
  assert.match(page, /El 024 no sustituye la atención sanitaria presencial/i);
  assert.match(page, /Desgracias\.es no es un servicio de emergencias/i);
});

test('months-later grief guide keeps authoritative sources and editorial date aligned with sitemap', () => {
  assert.match(page, /portal\.guiasalud\.es/);
  assert.match(page, /iris\.who\.int/);
  assert.match(page, /sanidad\.gob\.es\/linea024\//);
  assert.match(page, /Actualizado el 1 de septiembre de 2026/);
  assert.match(
    sitemap,
    /<loc>https:\/\/desgracias\.es\/duelo\/han-pasado-meses-y-sigo-muy-mal\/<\/loc><lastmod>2026-09-01<\/lastmod>/
  );
});
