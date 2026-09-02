import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pagePath = new URL('../soledad/me-siento-solo-aunque-tengo-gente/index.html', import.meta.url);
const sitemapPath = new URL('../sitemap.xml', import.meta.url);

const page = await readFile(pagePath, 'utf8');
const sitemap = await readFile(sitemapPath, 'utf8');

test('explica la soledad acompañada sin reducirla al número de contactos', () => {
  assert.match(page, /Estar acompañado y sentirse conectado no son lo mismo/i);
  assert.match(page, /estructura/i);
  assert.match(page, /función/i);
  assert.match(page, /calidad/i);
  assert.match(page, /compañía/i);
  assert.match(page, /reciprocidad/i);
  assert.match(page, /pertenencia/i);
});

test('ofrece un experimento gradual, concreto y respetuoso con la autonomía', () => {
  assert.match(page, /Un experimento pequeño para comprobar si un vínculo puede profundizar/i);
  assert.match(page, /Elige a una persona, no al grupo entero/i);
  assert.match(page, /una petición concreta/i);
  assert.match(page, /Observa la respuesta/i);
  assert.match(page, /No todas las relaciones tienen que cubrirlo todo/i);
});

test('protege frente a relaciones inseguras y exposición digital', () => {
  assert.match(page, /Si la relación es tensa, controladora o violenta/i);
  assert.match(page, /humilla, amenaza, controla, vigila/i);
  assert.match(page, /contraseñas/i);
  assert.match(page, /documentos/i);
  assert.match(page, /imágenes/i);
});

test('mantiene límites clínicos, evidencia prudente y carril de crisis', () => {
  assert.match(page, /Son asociaciones poblacionales/i);
  assert.match(page, /No toda soledad necesita una respuesta clínica/i);
  assert.match(page, /Desgracias\.es no es un servicio de emergencias/i);
  assert.match(page, /href="tel:112"/i);
  assert.match(page, /href="tel:024"/i);
});

test('declara fuentes primarias, canonical y revisión editorial', () => {
  assert.match(page, /<link rel="canonical" href="https:\/\/desgracias\.es\/soledad\/me-siento-solo-aunque-tengo-gente\/"\s*\/?>/i);
  assert.match(page, /who\.int\/news-room\/questions-and-answers\/item\/social-connection/i);
  assert.match(page, /who\.int\/publications\/i\/item\/978240112360/i);
  assert.match(page, /soledades\.es\/estudios\/barometro-soledad-no-deseada-espana-2024/i);
  assert.match(page, /sanidad\.gob\.es\/linea024/i);
  assert.match(page, /Actualizado el 2 de septiembre de 2026/i);
  assert.match(
    sitemap,
    /<loc>https:\/\/desgracias\.es\/soledad\/me-siento-solo-aunque-tengo-gente\/<\/loc><lastmod>2026-09-02<\/lastmod>/
  );
});
