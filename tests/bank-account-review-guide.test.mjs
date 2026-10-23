import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dinero/me-da-miedo-mirar-mi-cuenta/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
const inventory = await readFile(new URL('../SAFETY_ROUTE_INVENTORY.md', import.meta.url), 'utf8');
const policy = await readFile(new URL('../SAFETY_MONETIZATION_POLICY.md', import.meta.url), 'utf8');

test('empieza por un acceso bancario controlado y privado', () => {
  assert.match(html, /Antes de abrir: usa una ruta que controles/i);
  assert.match(html, /No uses el enlace ni el teléfono.*SMS, correo/is);
  assert.match(html, /aplicación instalada.*dirección oficial/i);
  assert.match(html, /No compartas contraseña, PIN, firma, código de un solo uso ni acceso remoto/i);
});

test('ofrece una revisión acotada de quince minutos', () => {
  for (const text of ['Revisión guiada de quince minutos', 'saldo disponible', 'próximo ingreso seguro', 'pagos esenciales', 'una acción']) {
    assert.match(html, new RegExp(text, 'i'));
  }
  assert.match(html, /Después puedes cerrar/i);
});

test('distingue saldo disponible y operaciones pendientes', () => {
  assert.match(html, /Saldo contable no siempre significa dinero utilizable/i);
  assert.match(html, /saldo disponible.*retenciones.*operaciones pendientes/is);
  assert.doesNotMatch(html, /todo el saldo.*puede gastarse/i);
});

test('prioriza fraude sin prometer devolución', () => {
  assert.match(html, /Si hay un cargo no reconocido, deja de revisar y actúa/i);
  assert.match(html, /Comunícalo inmediatamente.*canal oficial/i);
  assert.match(html, /no son necesariamente el mismo supuesto/i);
  assert.match(html, /no prometas ni des por hecho un reembolso automático/i);
});

test('separa fraude, desfase, déficit y avisos', () => {
  for (const text of ['Posible fraude', 'Desfase de fechas', 'Déficit mensual', 'Aviso con plazo']) {
    assert.match(html, new RegExp(text, 'i'));
  }
  assert.match(html, /nueva cuota no corrige el problema estructural/i);
});

test('incluye reclamación trazable y fuentes primarias', () => {
  assert.match(html, /servicio de atención al cliente o defensor del cliente/i);
  for (const host of ['clientebancario.bde.es', 'www.boe.es', 'www.incibe.es', 'www.sanidad.gob.es']) {
    assert.match(html, new RegExp(host.replaceAll('.', '\\.')));
  }
  assert.match(html, /No consta revisión externa individual/i);
});

test('protege privacidad, violencia, crisis y comercio', () => {
  assert.match(html, /no solicita capturas bancarias, contratos, DNI, IBAN, tarjetas, códigos/i);
  assert.match(html, /href="\/violencia\/"/i);
  assert.match(html, /href="tel:112"/i);
  assert.match(html, /href="tel:024"/i);
  assert.doesNotMatch(html, /Contar mi historia|Cuéntanos tu historia|<form\b|adsbygoogle|awin|adtraction|financeads|affiliate-link/i);
  assert.match(html, /sin publicidad, afiliación, captación/i);
});

test('incorpora la ruta a los dos inventarios Safety', () => {
  assert.match(inventory, /\| `\/dinero\/me-da-miedo-mirar-mi-cuenta\/` \|/);
  assert.match(inventory, /evitación financiera.*112 \+ 024/i);
  assert.match(policy, /- `\/dinero\/me-da-miedo-mirar-mi-cuenta\/`;/);
});

test('sincroniza canonical, WebPage, fecha y sitemap', () => {
  const url = 'https://desgracias.es/dinero/me-da-miedo-mirar-mi-cuenta/';
  assert.match(html, new RegExp('rel="canonical" href="' + url.replaceAll('/', '\\/') + '"'));
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-23"/);
  assert.match(html, /Actualizado el 23 de octubre de 2026/);
  assert.match(sitemap, new RegExp('<loc>' + url.replaceAll('/', '\\/') + '<\\/loc><lastmod>2026-10-23<\\/lastmod>'));
});
