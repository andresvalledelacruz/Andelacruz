import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dinero/tengo-deudas-y-no-se-por-donde-empezar/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('la guía transforma vergüenza y evitación en fotografía financiera sin culpabilizar', () => {
  assert.match(html, /que te cueste mirar no significa que seas irresponsable/i);
  assert.match(html, /reducir incertidumbre sin tomar decisiones irreversibles bajo presión/i);
  assert.match(html, /Puedes empezar con cifras aproximadas/i);
});

test('la guía protege necesidades básicas sin inventar una prioridad jurídica automática', () => {
  assert.match(html, /alimentación, vivienda, suministros esenciales, medicación/i);
  assert.match(html, /no convierte automáticamente una obligación concreta en “la primera que legalmente debes pagar”/i);
  assert.match(html, /no improvises una prioridad jurídica/i);
});

test('la guía evita decisiones financieras de alto impacto bajo presión y exige verificación', () => {
  assert.match(html, /No firmes, reconozcas ni aceptes una nueva obligación/i);
  assert.match(html, /Verifica antes de pagar una reclamación inesperada/i);
  assert.match(html, /la deuda existe/i);
  assert.match(html, /esta persona o empresa está legitimada/i);
  assert.match(html, /Una cuota más baja no siempre significa una deuda más barata/i);
  assert.match(html, /no puede determinar si reúnes los requisitos ni qué vía te conviene/i);
});

test('la ayuda social conserva autonomía y contempla violencia económica', () => {
  assert.match(html, /no para decidir por ti/i);
  assert.match(html, /no exige entregarle contraseñas, acceso bancario ni autoridad para contratar/i);
  assert.match(html, /violencia económica/i);
});

test('la ruta mantiene firewall comercial, límites YMYL y carril de crisis', () => {
  assert.match(html, /educación financiera general/i);
  assert.match(html, /no determina prioridades jurídicas individuales/i);
  assert.match(html, /no incluimos monetización ni llamadas comerciales/i);
  assert.match(html, /tel:112/);
  assert.match(html, /tel:024/);
  assert.match(html, /no es un servicio de emergencia/i);
});

test('canonical, fecha editorial y lastmod permanecen sincronizados', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/dinero\/tengo-deudas-y-no-se-por-donde-empezar\/"/);
  assert.match(html, /Actualizado el 1 de septiembre de 2026/i);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/dinero\/tengo-deudas-y-no-se-por-donde-empezar\/<\/loc><lastmod>2026-09-01<\/lastmod>/);
});