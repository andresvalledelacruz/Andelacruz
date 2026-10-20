import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../familia/necesito-poner-limites-a-mi-familia/index.html', import.meta.url), 'utf8');

test('la guía define límites como conducta propia y evita promesas de control', () => {
  assert.match(html, /Un límite y una orden no son lo mismo/i);
  assert.match(html, /qué respuesta depende de ti/i);
  assert.match(html, /no garantiza que la otra persona lo reciba bien/i);
});

test('la guía contempla dependencia económica, vivienda y cuidados antes de escalar', () => {
  assert.match(html, /dependes de esa persona para vivienda, dinero, transporte, cuidados/i);
  assert.match(html, /el límite tenga que ser gradual/i);
  assert.match(html, /orientación social, jurídica o de mediación/i);
});

test('violencia y represalias activan un carril de seguridad independiente', () => {
  assert.match(html, /prioriza tu seguridad/i);
  assert.match(html, /tel:112/);
  assert.match(html, /tel:016/);
  assert.match(html, /tel:900202010/);
  assert.match(html, /La mediación no debe utilizarse como sustituto de protección/i);
});

test('la página conserva canonical y límites profesionales', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/familia\/necesito-poner-limites-a-mi-familia\/"/);
  assert.match(html, /no sustituyen apoyo psicológico, social, jurídico ni de emergencia/i);
});


test('distingue petición, acuerdo, límite y castigo sin presentar control como autocuidado', () => {
  assert.match(html, /Petición, acuerdo, límite y castigo no son equivalentes/i);
  assert.match(html, /no se vuelve saludable por llamarlo “límite”/i);
  assert.match(html, /hecho, necesidad, respuesta y revisión/i);
});

test('incorpora privacidad digital y una salida segura ante control tecnológico', () => {
  assert.match(html, /Límites digitales dentro de la familia/i);
  assert.match(html, /dispositivo seguro/i);
  assert.match(html, /Agencia Española de Protección de Datos|AEPD/i);
});

test('sustituye la captación de historias por navegación privada hacia contenido existente', () => {
  assert.doesNotMatch(html, /Contar mi historia/i);
  assert.doesNotMatch(html, /href="\/\#inicio"/i);
  assert.match(html, /href="\/buscar\/"/i);
  assert.match(html, /No incluyas nombres, direcciones, documentos ni datos de terceras personas/i);
});

test('deriva dependencias prácticas a atención social primaria sin prometer prestaciones', () => {
  assert.match(html, /servicios sociales de atención primaria se prestan desde los municipios/i);
  assert.match(html, /dependen del territorio y de la valoración correspondiente/i);
  assert.match(html, /dsca\.gob\.es\/es\/derechos-sociales\/servicios-sociales/i);
});

test('fecha editorial y sitemap se mantienen alineados', async () => {
  const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
  assert.match(html, /"dateModified":"2026-10-20"/);
  assert.match(html, /Actualizado el 20 de octubre de 2026/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/familia\/necesito-poner-limites-a-mi-familia\/<\/loc><lastmod>2026-10-20<\/lastmod>/);
});
