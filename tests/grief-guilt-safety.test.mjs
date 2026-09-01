import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../duelo/me-siento-culpable-desde-que-murio/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('grief guilt guide separates guilt, responsibility, shame and hindsight', () => {
  assert.match(page, /No es lo mismo culpa, responsabilidad y vergüenza/i);
  assert.match(page, /Sentir culpa tampoco demuestra por sí mismo que seas responsable/i);
  assert.match(page, /Conocer el desenlace puede hacer que el pasado parezca más previsible/i);
  assert.match(page, /reparación no significa castigo/i);
  assert.match(page, /Hacerte daño, privarte de descanso o prohibirte volver a disfrutar no repara el pasado/i);
});

test('grief guilt guide keeps non-diagnostic boundary and routes high-risk guilt safely', () => {
  assert.match(page, /por sí sola, no permite diagnosticar un trastorno/i);
  assert.match(page, /peligro inmediato/i);
  assert.match(page, /href="tel:112"/);
  assert.match(page, /href="tel:024"/);
  assert.match(page, /servicio nacional, gratuito, confidencial y disponible las 24 horas/i);
  assert.match(page, /El 024 no sustituye la atención sanitaria presencial/i);
  assert.match(page, /Desgracias\.es no es un servicio de emergencias/i);
});

test('grief guilt guide preserves postvention routing without conflating it with generic grief', () => {
  assert.match(page, /Si la muerte fue por suicidio/i);
  assert.match(page, /culpa, estigma, preguntas sin respuesta y seguridad necesitan un tratamiento editorial distinto/i);
  assert.match(page, /\/duelo\/ha-muerto-por-suicidio-alguien-que-quiero\//);
});

test('grief guilt guide date and sitemap stay aligned', () => {
  assert.match(page, /Actualizado el 1 de septiembre de 2026/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/duelo\/me-siento-culpable-desde-que-murio\/<\/loc><lastmod>2026-09-01<\/lastmod>/);
});
