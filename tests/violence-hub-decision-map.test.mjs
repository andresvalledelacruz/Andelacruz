import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html = readFileSync('violencia/index.html', 'utf8');
const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('ofrece un mapa por necesidad sin diagnóstico ni obligación de denunciar', () => {
  for (const phrase of [
    'Hay peligro ahora',
    'no una emergencia inmediata',
    'La agresión física o sexual ha sido reciente',
    'La situación afecta a un niño, niña o adolescente',
    'Sospechas control del móvil',
    'Te preocupa otra persona',
  ]) assert.match(text, new RegExp(phrase, 'i'));
  assert.match(text, /no te obliga por sí sola a denunciar/i);
  assert.match(text, /no determina si existe delito/i);
});

test('mantiene recursos públicos con alcance diferenciado y fuentes primarias', () => {
  for (const phone of ['112', '016', '900202010', '017']) {
    assert.match(html, new RegExp(`href="tel:${phone}"`));
  }
  assert.match(text, /016 es un recurso específico frente a la violencia contra las mujeres/i);
  assert.match(text, /017 de INCIBE.*ayuda en ciberseguridad/i);
  assert.match(html, /administracion\.gob\.es\/tu-espacio-europeo\/derechos-obligaciones\/ciudadanos\/asistencia-sanitaria\/numeros-urgencia/);
  assert.match(html, /mjusticia\.gob\.es\/es\/ciudadania\/victimas\/oficinas-asistencia-victimas/);
  assert.match(html, /incibe\.es\/ciudadania\/atencion-telefonica/);
  assert.match(html, /anar\.org\/que-hacemos\/telefono-chat-anar/);
});

test('trata control digital sin recomendar cambios potencialmente reveladores', () => {
  assert.match(text, /modo privado o borrar el historial no ocultan necesariamente/i);
  assert.match(text, /Algunos cambios envían avisos/i);
  assert.match(text, /No elimines posibles pruebas/i);
  assert.match(text, /no sustituye al 112/i);
});

test('preserva Safety-first, portada y exclusión comercial', () => {
  assert.match(text, /Ruta Safety-first y no comercial/i);
  assert.doesNotMatch(html, /adsbygoogle|awin|adtraction|financeads|affiliate|lead-form|solicita presupuesto/i);
});

test('publica lastmod exacto sin duplicar la URL canónica', () => {
  const sitemap = readFileSync('sitemap.xml', 'utf8');
  const entries = [...sitemap.matchAll(/<url><loc>https:\/\/desgracias\.es\/violencia\/<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g)];
  assert.equal(entries.length, 1);
  assert.equal(entries[0][1], '2026-10-24');
});
