import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../soledad/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('el hub ofrece un mapa de 48 horas y separa seis decisiones', () => {
  assert.match(html, /Un mapa de decisión para las próximas 48 horas/i);
  for (const plane of ['Seguridad', 'Contacto hoy', 'Calidad del vínculo', 'Red a medio plazo', 'Barreras concretas', 'Revisión']) {
    assert.match(html, new RegExp(`<strong>${plane}\\.<\\/strong>`, 'i'));
  }
});

test('distingue soledad de aislamiento sin diagnosticar', () => {
  assert.match(html, /La soledad es una experiencia subjetiva/i);
  assert.match(html, /el aislamiento social describe de forma más objetiva/i);
  assert.match(html, /no permite por sí solo diagnosticar depresión, ansiedad ni ninguna otra enfermedad/i);
});

test('convierte necesidades distintas en acciones verificables', () => {
  for (const need of ['Necesito que me escuchen', 'Necesito compañía', 'Necesito pertenencia', 'Necesito apoyo práctico', 'No sé a quién llamar']) {
    assert.match(html, new RegExp(`<strong>${need}\\.<\\/strong>`, 'i'));
  }
  assert.match(html, /Un plan de siete días/i);
  assert.match(html, /coste, accesibilidad, idioma, horario y condiciones de participación/i);
  assert.match(html, /no se presupone cobertura/i);
});

test('protege privacidad y reduce riesgo en contactos nuevos', () => {
  assert.match(html, /evita enviar dinero, documentos, códigos, contraseñas o imágenes íntimas/i);
  assert.match(html, /no permitas acceso remoto a tus dispositivos/i);
  assert.match(html, /elige un lugar público, informa a alguien/i);
  assert.match(html, /cómo se denuncia una conducta/i);
});

test('sustituye captación por búsqueda privada y conserva crisis', () => {
  assert.doesNotMatch(html, /Contar mi historia/i);
  assert.doesNotMatch(html, /href="\/#inicio"/i);
  assert.match(html, /href="\/buscar\/"/i);
  for (const phone of ['112', '024', '717003717']) assert.match(html, new RegExp(`href="tel:${phone}"`));
  assert.match(html, /Desgracias\.es no es un servicio de emergencias/i);
  assert.doesNotMatch(html, /awin|adtraction|financeads|adsense|afiliad|publicidad/i);
});

test('usa fuentes primarias y alinea canonical, fechas y sitemap', () => {
  assert.match(html, /who\.int\/news-room\/questions-and-answers\/item\/social-connection/i);
  assert.match(html, /who\.int\/es\/publications\/m\/item\/from-loneliness-to-social-connection-summary/i);
  assert.match(html, /imserso\.es\/detalle-actualidad/i);
  assert.match(html, /sanidad\.gob\.es\/linea024\/home\.htm/i);
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/soledad\/"/);
  assert.match(html, /"dateModified":"2026-10-24"/);
  assert.match(html, /Actualizado el 24 de octubre de 2026/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/soledad\/<\/loc><lastmod>2026-10-24<\/lastmod>/);
});
