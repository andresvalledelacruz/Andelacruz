import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pagePath = new URL('../trabajo/quiero-encontrar-trabajo-cuanto-antes/index.html', import.meta.url);
const sitemapPath = new URL('../sitemap.xml', import.meta.url);

test('la guía urgente separa protección económica y búsqueda laboral', async () => {
  const html = await readFile(pagePath, 'utf8');
  assert.match(html, /La urgencia económica y la búsqueda de empleo son dos problemas distintos/);
  assert.match(html, /Ingreso inmediato o puente/);
  assert.match(html, /próximas 72 horas/i);
  assert.match(html, /próximas dos semanas/i);
});

test('no promete contratación ni convierte el desempleo en culpa individual', async () => {
  const html = await readFile(pagePath, 'utf8');
  assert.match(html, /no garantiza empleo, contratación ni un plazo/i);
  assert.match(html, /no demuestra que no sirvas/i);
  assert.match(html, /factores personales y externos/i);
  assert.doesNotMatch(html, /conseguirás trabajo|empleo garantizado|método infalible/i);
});

test('protege frente a fraude, explotación y exposición de datos', async () => {
  const html = await readFile(pagePath, 'utf8');
  assert.match(html, /No pagues por acceder a una oferta/i);
  assert.match(html, /nunca uses tu cuenta bancaria para recibir, mover o transferir dinero/i);
  assert.match(html, /No envíes dirección completa, DNI o NIE/);
  assert.match(html, /No entregues documentos originales/);
  assert.match(html, /retención de documentos o pasaporte/);
  assert.match(html, /INCIBE/);
});

test('delimita discriminación y escalado de crisis', async () => {
  const html = await readFile(pagePath, 'utf8');
  assert.match(html, /No toda negativa o rechazo es discriminación/);
  assert.match(html, /mites\.gob\.es\/denunciaitss/);
  assert.match(html, /Si temes hacerte daño/);
  assert.match(html, /href="tel:024"/);
  assert.match(html, /no sustituye al <a href="tel:112">112<\/a> ante una emergencia/);
});

test('mantiene fuentes y límites editoriales trazables', async () => {
  const html = await readFile(pagePath, 'utf8');
  assert.match(html, /no sustituye la información oficial/i);
  assert.match(html, /estudios colectivos.*no predicen/i);
  assert.match(html, /sepe\.es/);
  assert.match(html, /incibe\.es/);
  assert.match(html, /aepd\.es\/guias\/la-proteccion-de-datos-en-las-relaciones-laborales\.pdf/);
  assert.match(html, /doi\.org\/10\.1037\/a0035923/);
});

test('convierte cada oferta en una ficha verificable antes de solicitar', async () => {
  const html = await readFile(pagePath, 'utf8');
  assert.match(html, /crea una ficha mínima de la vacante/i);
  assert.match(html, /empresa o intermediario/);
  assert.match(html, /Marca como <strong>«no consta»<\/strong>/);
  assert.match(html, /dominio, el correo y el canal pertenecen realmente/);
});

test('prioriza vacantes sin puntuaciones universales ni volumen automático', async () => {
  const html = await readFile(pagePath, 'utf8');
  assert.match(html, /solicitar ahora/);
  assert.match(html, /verificar primero/);
  assert.match(html, /descartar/);
  assert.match(html, /sin confundir urgencia con encaje ni inventar una puntuación universal/i);
});

test('registra evidencias, versión y siguiente acción sin inferir lectura', async () => {
  const html = await readFile(pagePath, 'utf8');
  assert.match(html, /relaciona cada requisito importante con una evidencia propia/i);
  assert.match(html, /nombre de versión/);
  assert.match(html, /evita deducir que una candidatura fue leída/i);
  assert.match(html, /seguimiento solo cuando exista un canal legítimo/i);
});

test('la superficie vulnerable no contiene CTA participativo ni monetización', async () => {
  const html = await readFile(pagePath, 'utf8');
  assert.doesNotMatch(html, /Contar mi situación|class="cta"|href="\/#inicio"/i);
  assert.doesNotMatch(html, /adsbygoogle|affiliate|patrocinado|comprar ahora/i);
});

test('mejora accesibilidad y entidad editorial', async () => {
  const html = await readFile(pagePath, 'utf8');
  assert.match(html, /<nav class="breadcrumbs" aria-label="Migas de pan">/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /"@type":"Article"/);
  assert.match(html, /"dateModified":"2026-10-27"/);
  assert.match(html, /Actualizado el 27 de octubre de 2026/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(html, /<h1>Quiero encontrar trabajo cuanto antes<\/h1>/);
});

test('sincroniza la fecha editorial con el sitemap', async () => {
  const sitemap = await readFile(sitemapPath, 'utf8');
  assert.match(sitemap, /https:\/\/desgracias\.es\/trabajo\/quiero-encontrar-trabajo-cuanto-antes\/<\/loc><lastmod>2026-10-27<\/lastmod>/);
});
