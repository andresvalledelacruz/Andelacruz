import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../trabajo/no-consigo-desconectar-del-trabajo/index.html', import.meta.url), 'utf8');

test('la guía distingue exposición laboral de activación mental sin diagnosticar', () => {
  assert.match(html, /dos capas de desconexión/i);
  assert.match(html, /desconexión externa/i);
  assert.match(html, /desconexión interna/i);
  assert.match(html, /No conviertas automáticamente esa experiencia en un diagnóstico/i);
});

test('la guía evita trasladar toda la responsabilidad a la persona trabajadora', () => {
  assert.match(html, /no es un examen de fuerza de voluntad/i);
  assert.match(html, /carga, los plazos, la cultura de disponibilidad o la organización/i);
  assert.match(html, /política interna de desconexión/i);
});

test('la guía conserva límites legales y profesionales', () => {
  assert.match(html, /artículo 88 de la Ley Orgánica 3\/2018/i);
  assert.match(html, /asesoramiento laboral cualificado/i);
  assert.match(html, /no sustituye prevención de riesgos, atención sanitaria ni asesoramiento laboral o jurídico/i);
});

test('una crisis mantiene el carril 112 y 024 y el límite de servicio', () => {
  assert.match(html, /tel:112/);
  assert.match(html, /tel:024/);
  assert.match(html, /Desgracias\.es no es un servicio de emergencias ni supervisa historias de forma continua/i);
});

test('la página conserva canonical y referencia oficial reciente del INSST', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/trabajo\/no-consigo-desconectar-del-trabajo\/"/);
  assert.match(html, /29 de abril de 2026/i);
});
