import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../duelo/ha-muerto-mi-mascota-y-estoy-destrozado/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('la guía valida el vínculo sin equiparar ni jerarquizar pérdidas', () => {
  assert.match(html, /No necesitas comparar esta muerte con la de una persona/i);
  assert.match(html, /defender que la pérdida importa/i);
  assert.match(html, /No estás obligado\/a a convencer a nadie/i);
});

test('la culpa por eutanasia se ordena sin emitir juicio veterinario retrospectivo', () => {
  assert.match(html, /No podemos valorar retrospectivamente una decisión veterinaria concreta/i);
  assert.match(html, /lo que sabías entonces/i);
  assert.match(html, /lo que te explicó el equipo veterinario/i);
  assert.match(html, /lo que ahora sabes porque ya conoces el desenlace/i);
});

test('la guía ofrece coordinación privada y reversible para las primeras 48 horas', () => {
  assert.match(html, /Una hoja privada para ordenar las próximas 48 horas/i);
  assert.match(html, /Hechos confirmados/i);
  assert.match(html, /Necesidades de hoy/i);
  assert.match(html, /Tarea, responsable y plazo/i);
  assert.match(html, /Decisiones que pueden esperar/i);
  assert.match(html, /el silencio no equivale a aceptación/i);
  assert.match(html, /No la uses para reconstruir continuamente la muerte/i);
});

test('la guía protege información veterinaria y elimina captación de relatos', () => {
  assert.match(html, /No publiques informes veterinarios, facturas, conversaciones/i);
  assert.match(html, /imágenes sensibles ni datos de otras personas/i);
  assert.doesNotMatch(html, /Contar mi historia/i);
  assert.doesNotMatch(html, /href="\/#inicio"/i);
  assert.match(html, /href="\/buscar\/"/i);
});

test('la guía protege a menores y evita convertirles en cuidadores emocionales', () => {
  assert.match(html, /No es necesario dar detalles que no hayan preguntado/i);
  assert.match(html, /responsables de consolar a los adultos/i);
  assert.match(html, /orientación profesional adecuada a su edad/i);
});

test('la página conserva límites profesionales, canonical y carril de emergencia', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/duelo\/ha-muerto-mi-mascota-y-estoy-destrozado\/"/);
  assert.match(html, /no interpreta síntomas ni sustituye atención veterinaria/i);
  assert.match(html, /tel:112/);
  assert.match(html, /tel:024/);
  assert.match(html, /no es un servicio de emergencias ni supervisa historias de forma continua/i);
  assert.match(html, /servicio nacional, gratuito, confidencial y disponible las 24 horas/i);
  assert.match(html, /El 024 no sustituye la atención sanitaria presencial/i);
});

test('la página mantiene metadatos, fuentes locales y fecha editorial alineada', () => {
  assert.match(html, /Actualizado el 28 de octubre de 2026/);
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-28"/);
  assert.match(html, /href="\/assets\/home-fonts\.css"/i);
  assert.match(html, /src="\/public-page-runtime\.js" defer/i);
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);
  assert.match(html, /ebusiness\.avma\.org/i);
  assert.match(html, /colvet\.es/i);
  assert.match(
    sitemap,
    /<loc>https:\/\/desgracias\.es\/duelo\/ha-muerto-mi-mascota-y-estoy-destrozado\/<\/loc><lastmod>2026-10-28<\/lastmod>/
  );
});
