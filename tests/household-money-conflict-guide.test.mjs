import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dinero/en-casa-discutimos-por-dinero/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
const inventory = await readFile(new URL('../SAFETY_ROUTE_INVENTORY.md', import.meta.url), 'utf8');
const policy = await readFile(new URL('../SAFETY_MONETIZATION_POLICY.md', import.meta.url), 'utf8');

test('ofrece un mapa diferenciado para las próximas 48 horas', () => {
  for (const text of ['Mapa para las próximas 48 horas', 'Faltan necesidades básicas', 'Hay deuda o un aviso con plazo', 'Las cifras cuadran, pero el reparto no', 'Hay control, miedo o represalias']) {
    assert.match(html, new RegExp(text, 'i'));
  }
});

test('construye tres escenarios de presupuesto y protege documentos', () => {
  for (const text of ['Mes ordinario', 'Mes caro', 'Ingresos reducidos']) assert.match(html, new RegExp(text, 'i'));
  assert.match(html, /No enviéis nóminas, contratos, extractos ni datos bancarios/i);
});

test('separa bolsas y evita imponer un único modelo de cuentas', () => {
  for (const text of ['Común esencial', 'Compromisos individuales', 'Margen personal', 'Futuro e imprevistos']) assert.match(html, new RegExp(text, 'i'));
  assert.match(html, /Cuenta conjunta, cuentas separadas o un modelo mixto pueden funcionar/i);
  assert.match(html, /no tiene que ser automáticamente 50\/50/i);
});

test('trata deuda desconocida sin inventar responsabilidad jurídica', () => {
  assert.match(html, /Si aparece una deuda desconocida/i);
  assert.match(html, /No presupongáis responsabilidad jurídica/i);
  assert.match(html, /Titularidad, garantías, régimen económico, contrato y jurisdicción importan/i);
});

test('limita mediación y distingue idioma de jurisdicción', () => {
  assert.match(html, /voluntariedad e igualdad de oportunidades/i);
  assert.match(html, /Idioma de atención y ámbito jurídico no son lo mismo/i);
  assert.match(html, /no uséis mediación o terapia conjunta como primera respuesta/i);
});

test('protege menores, privacidad, violencia y crisis', () => {
  assert.match(html, /no los convirtáis en mensajeros o árbitros/i);
  assert.match(html, /href="tel:112"/i);
  assert.match(html, /href="tel:016"/i);
  assert.match(html, /href="tel:024"/i);
  assert.match(html, /href="\/violencia\/"/i);
  assert.match(html, /sin publicidad, afiliación, captación/i);
  assert.doesNotMatch(html, /Contar mi historia|Cuéntanos tu historia|<form\b|adsbygoogle|awin|adtraction|financeads|affiliate-link/i);
});

test('cita fuentes públicas y declara límites editoriales', () => {
  for (const host of ['finanzasparatodos.es', 'www.boe.es', 'www.mjusticia.gob.es', 'violenciagenero.igualdad.gob.es', 'www.sanidad.gob.es']) {
    assert.match(html, new RegExp(host.replaceAll('.', '\\.')));
  }
  assert.match(html, /No consta revisión externa individual/i);
});

test('incorpora la ruta a inventarios Safety y monetización', () => {
  assert.match(inventory, /\| `\/dinero\/en-casa-discutimos-por-dinero\/` \|/);
  assert.match(inventory, /conflicto económico doméstico.*112 \+ 024 \+ 016/is);
  assert.match(policy, /- `\/dinero\/en-casa-discutimos-por-dinero\/`;/);
});

test('sincroniza canonical, WebPage, fecha y sitemap', () => {
  const url = 'https://desgracias.es/dinero/en-casa-discutimos-por-dinero/';
  assert.match(html, new RegExp('rel="canonical" href="' + url.replaceAll('/', '\\/') + '"'));
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-23"/);
  assert.match(html, /Actualizado el 23 de octubre de 2026/);
  assert.match(sitemap, new RegExp('<loc>' + url.replaceAll('/', '\\/') + '<\\/loc><lastmod>2026-10-23<\\/lastmod>'));
});
