import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pagePath = new URL('../familia/mi-familia-no-me-habla/index.html', import.meta.url);
const sitemapPath = new URL('../sitemap.xml', import.meta.url);

const page = await readFile(pagePath, 'utf8');
const sitemap = await readFile(sitemapPath, 'utf8');

test('distingue tipos de silencio sin inventar intención ni culpabilidad', () => {
  assert.match(page, /No todo silencio familiar significa lo mismo/i);
  assert.match(page, /Pausa acordada/i);
  assert.match(page, /Distancia difusa/i);
  assert.match(page, /Ruptura explícita/i);
  assert.match(page, /Silencio coercitivo/i);
  assert.match(page, /No puedes saber la intención únicamente por la ausencia de respuesta/i);
});

test('separa hechos, interpretaciones y pérdida ambigua', () => {
  assert.match(page, /lo que sé/i);
  assert.match(page, /lo que estoy interpretando/i);
  assert.match(page, /pérdida ambigua/i);
  assert.match(page, /no elimina el dolor/i);
});

test('protege autonomía, límites y menores frente a triangulación', () => {
  assert.match(page, /No conviertas a otras personas en mensajeros o investigadores/i);
  assert.match(page, /enviar mensajes mediante menores/i);
  assert.match(page, /Pedir perdón no exige asumir todo ni borrarte/i);
  assert.match(page, /La ausencia de respuesta no explica el motivo/i);
});

test('condiciona reparación y mediación a voluntad y seguridad', () => {
  assert.match(page, /Una reparación necesita más que volver a hablar/i);
  assert.match(page, /voluntad de ambas partes/i);
  assert.match(page, /no existe violencia o coacción/i);
  assert.match(page, /si la mediación es segura y apropiada/i);
});

test('mantiene protección de crisis, violencia y privacidad', () => {
  assert.match(page, /protege contraseñas y documentos/i);
  assert.match(page, /href="tel:112"/i);
  assert.match(page, /href="tel:016"/i);
  assert.match(page, /href="tel:024"/i);
  assert.match(page, /Desgracias\.es no es un servicio de emergencias/i);
  assert.match(page, /sin nombres, direcciones, teléfonos, capturas ni otros datos identificativos/i);
});

test('declara límites de evidencia, fuentes, canonical y revisión', () => {
  assert.match(page, /son datos poblacionales de Estados Unidos y no permiten predecir tu caso/i);
  assert.match(page, /no asigna culpabilidad/i);
  assert.match(page, /pubmed\.ncbi\.nlm\.nih\.gov\/37304343/i);
  assert.match(page, /pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC12504279/i);
  assert.match(page, /violenciagenero\.igualdad\.gob\.es/i);
  assert.match(page, /sanidad\.gob\.es\/linea024/i);
  assert.match(page, /<link rel="canonical" href="https:\/\/desgracias\.es\/familia\/mi-familia-no-me-habla\/"\s*\/?>/i);
  assert.match(page, /Actualizado el 2 de septiembre de 2026/i);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/familia\/mi-familia-no-me-habla\/<\/loc><lastmod>2026-09-02<\/lastmod>/);
});
