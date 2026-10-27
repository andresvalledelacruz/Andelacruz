import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('trabajo/tengo-miedo-de-equivocarme-en-el-trabajo/index.html', 'utf8');
const sitemap = readFileSync('sitemap.xml', 'utf8');

test('fear of error guide distinguishes risk, unclear systems, punitive culture and anticipatory fear', () => {
  for (const signal of ['El error tiene consecuencias reales', 'No tienes suficiente claridad o apoyo', 'El entorno castiga el error', 'El miedo aparece incluso con medios suficientes']) {
    assert.match(html, new RegExp(signal, 'i'), signal);
  }
  assert.match(html, /si otra persona competente.+información y el apoyo necesarios/is);
});

test('fear of error guide provides a safe response after a possible incident', () => {
  for (const signal of ['Comprueba si el riesgo continúa', 'No ocultes ni “arregles” el rastro', 'Separa hecho, duda e impacto', 'Comunica por el canal previsto', 'Contén solo dentro de tu función', 'Conserva una cronología mínima']) {
    assert.match(html, new RegExp(signal, 'i'), signal);
  }
  assert.match(html, /no debe reducirse solo al “error humano”/i);
});

test('fear of error guide handles personal-data incidents without assigning the controller role to employees', () => {
  assert.match(html, /Si el posible error afecta a datos personales/i);
  assert.match(html, /responsable del tratamiento la valoración del riesgo/i);
  assert.match(html, /72 horas.+obligación de la organización/is);
  assert.match(html, /no convierte a cada empleado en responsable de notificar directamente a la AEPD/i);
  assert.match(html, /aepd\.es\/derechos-y-deberes.+brechas-de-datos-personales-notificacion/i);
});

test('fear of error guide separates autonomy, review and stop thresholds', () => {
  assert.match(html, /tres niveles:.+autonomía.+segunda revisión.+parada o autorización/is);
  assert.match(html, /artículo 21/i);
  assert.match(html, /href="tel:112"/i);
  assert.match(html, /Los límites concretos dependen del puesto y deben proceder de la organización/i);
});

test('fear of error guide adds a bounded pre-action check for high-impact work', () => {
  for (const signal of ['Objeto:', 'Versión:', 'Alcance:', 'Reversibilidad:', 'Permiso:', 'Evidencia:']) {
    assert.match(html, new RegExp(signal, 'i'), signal);
  }
  assert.match(html, /No inventes una autorización ni conviertas la prisa en permiso/i);
});

test('fear of error guide treats AI as an untrusted aid and protects workplace data', () => {
  assert.match(html, /Una IA no sustituye el control del puesto/i);
  assert.match(html, /No la uses como aprobación, firma, dictamen profesional ni segunda comprobación independiente/i);
  assert.match(html, /No pegues nombres, documentos internos, credenciales, código privado/i);
  assert.match(html, /ejemplos ficticios o anonimizados de forma efectiva/i);
  assert.match(html, /aepd\.es\/guias\/recomendaciones-ia-aepd\.pdf/i);
  assert.match(html, /incibe\.es\/empresas\/blog\/factor-humano-en-ciberseguridad/i);
});

test('fear of error guide routes to published non-commercial help and discloses review status', () => {
  assert.match(html, /href="\/buscar\/"/i);
  assert.match(html, /No consta revisión individual por un profesional externo/i);
  assert.doesNotMatch(html, /href="\/#inicio"/i);
  assert.doesNotMatch(html, /adsbygoogle|affiliate|visitor-analytics|contratación garantizada/i);
});

test('fear of error guide metadata and sitemap share the real modification date', () => {
  assert.match(html, /"@type":"WebPage"/);
  assert.match(html, /"dateModified":"2026-10-27"/);
  assert.match(html, /Actualizado el 27 de octubre de 2026/);
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/trabajo\/tengo-miedo-de-equivocarme-en-el-trabajo\/"/);
  assert.match(sitemap, /tengo-miedo-de-equivocarme-en-el-trabajo\/<\/loc><lastmod>2026-10-27<\/lastmod>/);
});

test('fear of error guide avoids third-party font requests', () => {
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);
});
