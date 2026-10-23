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
  assert.match(html, /Actualizado el 23 de octubre de 2026/i);
  assert.match(html, /"dateModified":"2026-10-23"/);
  assert.match(html, /article:modified_time" content="2026-10-23"/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/dinero\/tengo-deudas-y-no-se-por-donde-empezar\/<\/loc><lastmod>2026-10-23<\/lastmod>/);
});

test('la guía diferencia el problema financiero antes de recomendar una vía', () => {
  assert.match(html, /Desfase puntual de liquidez/i);
  assert.match(html, /Déficit mensual estructural/i);
  assert.match(html, /Sobreendeudamiento/i);
  assert.match(html, /Posible insolvencia o procedimiento en marcha/i);
  assert.match(html, /no un diagnóstico jurídico/i);
});

test('la guía exige escenarios sostenibles y compara opciones más allá de la cuota', () => {
  assert.match(html, /escenario conservador, escenario probable y escenario con un gasto imprevisto razonable/i);
  assert.match(html, /Mantener el calendario actual/i);
  assert.match(html, /Negociar fecha, carencia o plazo/i);
  assert.match(html, /Consolidar o refinanciar/i);
  assert.match(html, /avalanza/i);
  assert.match(html, /bola de nieve/i);
  assert.match(html, /no reglas jurídicas/i);
});

test('la negociación queda documentada y no induce aceptación telefónica', () => {
  assert.match(html, /desglose y las condiciones por escrito/i);
  assert.match(html, /hoy no voy a aceptar una nueva obligación por teléfono/i);
  assert.match(html, /No prometas una cantidad que depende de ingresos no confirmados/i);
});

test('la ruta protege documentos y separa idioma de jurisdicción', () => {
  assert.match(html, /No envíes DNI, contratos, extractos, claves, códigos de un solo uso/i);
  assert.match(html, /esta página no recibe ni revisa documentación/i);
  assert.match(html, /País, idioma y jurisdicción no son lo mismo/i);
  assert.match(html, /Una traducción o una atención en tu idioma no acredita por sí sola competencia profesional/i);
  assert.match(html, /servicio-de-gestion-de-expedientes-de-justicia-gratuita/i);
});
