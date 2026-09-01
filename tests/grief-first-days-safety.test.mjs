import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../duelo/ha-muerto-alguien-que-quiero-y-no-se-como-seguir/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('first-days grief guide stays non-diagnostic and avoids normative timelines', () => {
  assert.match(page, /no permite diagnosticar por sí sola un trastorno/i);
  assert.match(page, /no existe una secuencia emocional obligatoria/i);
  assert.match(page, /no hay un número de semanas/i);
  assert.match(page, /Esta página no puede determinar si existe un problema clínico/i);
  assert.match(page, /Una web no puede diagnosticar duelo prolongado/i);
});

test('first-days grief guide covers practical, relational and identity impacts', () => {
  assert.match(page, /rutinas y tu identidad/i);
  assert.match(page, /Las “primeras veces” pueden reactivar el dolor/i);
  assert.match(page, /no todos van a vivir la pérdida al mismo ritmo/i);
  assert.match(page, /lo que realmente debe decidirse ahora/i);
});

test('first-days grief guide preserves urgent 112 and 024 safety routing', () => {
  assert.match(page, /peligro inmediato/i);
  assert.match(page, /href="tel:112"/);
  assert.match(page, /href="tel:024"/);
  assert.match(page, /servicio nacional, gratuito, confidencial y disponible las 24 horas/i);
  assert.match(page, /El 024 no sustituye la atención sanitaria presencial/i);
  assert.match(page, /Desgracias\.es no es un servicio de emergencias/i);
});

test('first-days grief guide keeps editorial date aligned with sitemap', () => {
  assert.match(page, /Actualizado el 1 de septiembre de 2026/);
  assert.match(
    sitemap,
    /<loc>https:\/\/desgracias\.es\/duelo\/ha-muerto-alguien-que-quiero-y-no-se-como-seguir\/<\/loc><lastmod>2026-09-01<\/lastmod>/
  );
});
