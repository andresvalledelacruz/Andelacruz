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
  assert.match(page, /Un mapa para las próximas 48 horas/i);
  assert.match(page, /prueba limitada, reversible y segura/i);
  assert.match(page, /Un experimento pequeño para comprobar si un vínculo puede profundizar/i);
  assert.match(page, /Elige a una persona, no al grupo entero/i);
  assert.match(page, /una petición concreta/i);
  assert.match(page, /Observa la respuesta/i);
  assert.match(page, /No todas las relaciones tienen que cubrirlo todo/i);
});

test('revisa vínculos mediante conductas sin adivinar intenciones ni vigilar', () => {
  assert.match(page, /Revisa conductas sin adivinar intenciones/i);
  for (const signal of ['Disponibilidad', 'Respeto', 'Confidencialidad', 'Reciprocidad', 'Reparación', 'Compatibilidad real']) {
    assert.match(page, new RegExp(signal, 'i'));
  }
  assert.match(page, /No conviertas esta revisión en vigilancia/i);
});

test('protege frente a relaciones inseguras y exposición digital', () => {
  assert.match(page, /Si la relación es tensa, controladora o violenta/i);
  assert.match(page, /humilla, amenaza, controla, vigila/i);
  assert.match(page, /contraseñas/i);
  assert.match(page, /documentos/i);
  assert.match(page, /imágenes/i);
  assert.match(page, /No publiques conversaciones, diagnósticos, imágenes o datos de terceras personas/i);
  assert.match(page, /borrar una publicación no garantiza que desaparezcan las copias/i);
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
  assert.match(page, /imserso\.es\/detalle-actualidad/i);
  assert.match(page, /aepd\.es\/preguntas-frecuentes\/17-internet-y-redes-sociales/i);
  assert.match(page, /"@type":"WebPage"/i);
  assert.match(page, /"dateModified":"2026-10-27"/i);
  assert.match(page, /Actualizado el 27 de octubre de 2026/i);
  assert.match(
    sitemap,
    /<loc>https:\/\/desgracias\.es\/soledad\/me-siento-solo-aunque-tengo-gente\/<\/loc><lastmod>2026-10-27<\/lastmod>/
  );
});

test('usa recursos locales y sustituye la captación por búsqueda privada', () => {
  assert.match(page, /href="\/assets\/home-fonts\.css"/i);
  assert.doesNotMatch(page, /fonts\.(?:googleapis|gstatic)\.com/i);
  assert.match(page, /src="\/public-page-runtime\.js"/i);
  assert.match(page, /Busca un siguiente paso sin enviar tu historia/i);
  assert.match(page, /href="\/buscar\/"/i);
  assert.doesNotMatch(page, />Contar mi historia</i);
});
