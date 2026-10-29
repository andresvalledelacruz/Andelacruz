import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../profesionales.html', import.meta.url), 'utf8');
const preview = await readFile(new URL('../professional-application-preview.js', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('la vista previa separa establecimiento, cobertura territorial e idioma', () => {
  assert.match(preview, /País de establecimiento declarado['"], 'pro-country'/);
  assert.match(preview, /Países de prestación declarados['"], 'pro-service-countries'/);
  assert.match(preview, /Idiomas de atención declarados['"], 'pro-languages'/);
  assert.match(html, /Idioma, modalidad online y país de establecimiento son datos distintos/i);
  assert.match(html, /ninguno demuestra por sí solo autorización para atender en otra jurisdicción/i);
});

test('el ciclo de ficha distingue borrador, solicitud, revisión, autorización y publicación', () => {
  for (const copy of [
    'Borrador local', 'Solicitud preparada', 'Recibida y pendiente de revisión',
    'Revisada', 'Autorizada para publicar', 'Publicada y vigente'
  ]) assert.match(html, new RegExp(copy, 'i'));
  assert.match(html, /solicitud recibida, no como lead, conversión o ingreso/i);
  assert.match(html, /La revisión favorable no publica automáticamente/i);
  assert.match(html, /puede retirarse o pasar a revisión si caduca la evidencia/i);
});

test('la ampliación no activa el directorio ni expone documentos privados', () => {
  assert.match(html, /El directorio de profesionales todavía no está disponible/i);
  assert.match(html, /No se publicarían documentos de identidad, acreditaciones privadas/i);
  assert.match(html, /No hay fichas públicas, buscador de profesionales ni servicio de contacto o contratación activo/i);
});

test('metadatos y sitemap identifican la edición revisada', () => {
  assert.match(html, /"dateModified":"2026-10-29"/);
  assert.match(html, /Contenido editorial actualizado el 29 de octubre de 2026/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/profesionales\.html<\/loc><lastmod>2026-10-29<\/lastmod>/);
});
