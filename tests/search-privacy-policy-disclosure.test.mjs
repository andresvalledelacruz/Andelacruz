import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const privacy = await readFile(new URL('../privacidad.html', import.meta.url), 'utf8');
const search = await readFile(new URL('../buscar/index.html', import.meta.url), 'utf8');

test('privacy policy explains local search processing without absolute anonymity claims', () => {
  assert.match(privacy, /Buscador de ayuda/i);
  assert.match(privacy, /analiza en el propio navegador el texto que escribes/i);
  assert.match(privacy, /El código de esta página no transmite ese texto a nuestros servidores/i);
  assert.match(privacy, /no lo guarda en cookies ni en almacenamiento local/i);
  assert.match(privacy, /no lo incorpora a la analítica de contenidos/i);
  assert.match(privacy, /se elimina del campo al ejecutar la búsqueda/i);
  assert.match(privacy, /se limpia al salir de la página o restaurarla desde el historial/i);
  assert.match(privacy, /Evita incluir nombres, direcciones, teléfonos u otros datos personales/i);
});

test('privacy policy names both current static delivery providers', () => {
  assert.match(privacy, /Cloudflare Pages/i);
  assert.match(privacy, /CDN, DNS y protección de la entrega/i);
  assert.match(privacy, /GitHub Pages/i);
});

test('privacy policy distinguishes search text from hosting security metadata', () => {
  assert.match(privacy, /alojamiento o CDN la página y sus módulos/i);
  assert.match(privacy, /dirección IP, navegador, fecha, hora y ruta solicitada/i);
  assert.match(privacy, /no incorpora el texto escrito a la URL ni a esas solicitudes/i);
  assert.match(privacy, /esos metadatos técnicos no son el contenido de la consulta/i);
  assert.doesNotMatch(privacy, /anonimato (?:total|absoluto) del buscador/i);
});

test('search implementation remains consistent with the privacy disclosure', () => {
  assert.doesNotMatch(search, /fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|URLSearchParams|location\.search/i);
  assert.doesNotMatch(search, /<form[^>]+action=/i);
  assert.match(search, /query\.value = '';/);
  assert.match(search, /window\.addEventListener\('pagehide', clearSensitiveState\)/);
  assert.match(search, /window\.addEventListener\('pageshow', clearSensitiveState\)/);
});

test('privacy policy exposes the current version date in visible and structured metadata', () => {
  assert.match(privacy, /Actualizada el 8 de septiembre de 2026/i);
  assert.match(privacy, /"dateModified":"2026-09-08"/i);
});
