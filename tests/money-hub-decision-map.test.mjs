import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dinero/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('el hub diferencia cinco intenciones antes de proponer una decisión', () => {
  for (const text of ['Falta para una necesidad básica','Hay un vencimiento cercano','El déficit se repite cada mes','Hay varias deudas o reclamaciones','No reconoces un cargo o discrepas con el banco']) assert.match(html, new RegExp(text, 'i'));
  assert.match(html, /no establece una prioridad jurídica individual/i);
});

test('la comparación financiera usa coste completo y no recomienda productos', () => {
  for (const text of ['TAE', 'importe total adeudado', 'productos vinculados', 'garantía personal o real']) assert.match(html, new RegExp(text, 'i'));
  assert.match(html, /una cuota nueva más baja puede deberse a un plazo mayor/i);
  assert.match(html, /no compara prestamistas ni decide qué producto debes contratar/i);
});

test('la guía protege datos, evita fraude y retira la captación heredada', () => {
  assert.match(html, /sin contraseñas, números completos de cuenta ni documentos de identidad/i);
  assert.match(html, /No entregues claves, códigos de un solo uso ni acceso remoto/i);
  assert.doesNotMatch(html, /Contar mi historia|Cuéntanos tu historia|<form\b/i);
  assert.doesNotMatch(html, /adsbygoogle|awin|adtraction|financeads|solicita presupuesto|contrata ahora/i);
});

test('mantiene ayuda pública, crisis y límites editoriales explícitos', () => {
  assert.match(html, /href="tel:020"/i);
  assert.match(html, /href="tel:112"/i);
  assert.match(html, /href="tel:024"/i);
  assert.match(html, /no consta revisión financiera o jurídica individual externa/i);
  assert.match(html, /no es un servicio de emergencias ni un canal atendido en directo/i);
});

test('canonical, datos estructurados, fecha visible y sitemap están sincronizados', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/dinero\/"/);
  assert.match(html, /"dateModified":"2026-10-23"/);
  assert.match(html, /Actualizado el 23 de octubre de 2026/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/dinero\/<\/loc><lastmod>2026-10-23<\/lastmod>/);
});
