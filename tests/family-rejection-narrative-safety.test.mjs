import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pagePath = new URL('../familia/siento-que-mi-familia-no-me-quiere/index.html', import.meta.url);
const sitemapPath = new URL('../sitemap.xml', import.meta.url);

const page = await readFile(pagePath, 'utf8');
const sitemap = await readFile(sitemapPath, 'utf8');

test('separa sentimiento, conductas y veredicto sobre el afecto', () => {
  assert.match(page, /Lo que sientes importa, pero no necesitas convertirlo inmediatamente en un veredicto/i);
  assert.match(page, /no podemos saber exactamente qué sienten/i);
  assert.match(page, /cómo me tratan/i);
  assert.match(page, /existe alguna voluntad de cambiar/i);
});

test('distingue dimensiones familiares sin exigir aprobación', () => {
  for (const term of ['Afecto', 'Cuidado', 'Respeto', 'Aprobación', 'Pertenencia', 'Reciprocidad']) {
    assert.match(page, new RegExp(term, 'i'));
  }
  assert.match(page, /No necesitas aprobación permanente para merecer respeto y seguridad/i);
});

test('evita diagnósticos y causalidad individual impropia', () => {
  assert.match(page, /una página web no puede diagnosticar personas/i);
  assert.match(page, /no permite diagnosticar tu salud ni atribuir causalidad individual/i);
  assert.match(page, /no demuestra por sí sola la causa de una situación individual/i);
});

test('protege dependencia, privacidad, menores y necesidades básicas', () => {
  assert.match(page, /No conviertas una recomendación genérica de “cortar el contacto”/i);
  assert.match(page, /No entregues contraseñas, códigos bancarios ni documentos originales/i);
  assert.match(page, /Si eres menor de edad/i);
  assert.match(page, /adulto seguro/i);
  assert.match(page, /Comprueba necesidades básicas/i);
});

test('mantiene carriles de violencia y crisis sin monetización', () => {
  assert.match(page, /href="tel:112"/i);
  assert.match(page, /href="tel:016"/i);
  assert.match(page, /href="tel:900202010"/i);
  assert.match(page, /href="tel:024"/i);
  assert.match(page, /Desgracias\.es no es un servicio de emergencias/i);
  assert.doesNotMatch(page, /afiliad[oa]|patrocinad[oa]|compra ahora|contrata ahora|anuncio comercial/i);
});

test('declara fuentes, canonical, privacidad y revisión editorial', () => {
  assert.match(page, /pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC5954612/i);
  assert.match(page, /pubmed\.ncbi\.nlm\.nih\.gov\/19117902/i);
  assert.match(page, /who\.int\/news-room\/fact-sheets\/detail\/child-maltreatment/i);
  assert.match(page, /anar\.org\/que-hacemos\/telefono-chat-anar/i);
  assert.match(page, /violenciagenero\.igualdad\.gob\.es/i);
  assert.match(page, /sanidad\.gob\.es\/linea024/i);
  assert.match(page, /sin nombres, direcciones, teléfonos, capturas, centros de estudio/i);
  assert.match(page, /<link rel="canonical" href="https:\/\/desgracias\.es\/familia\/siento-que-mi-familia-no-me-quiere\/"\s*\/?>/i);
  assert.match(page, /Actualizado el 2 de septiembre de 2026/i);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/familia\/siento-que-mi-familia-no-me-quiere\/<\/loc><lastmod>2026-09-02<\/lastmod>/);
});
