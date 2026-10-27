import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../rupturas/mi-pareja-me-ha-dejado/index.html', import.meta.url), 'utf8');

test('la guía separa seguridad, funcionamiento, logística y dolor sin diagnosticar', () => {
  assert.match(html, /Un mapa de 72 horas: cuatro carriles que no conviene mezclar/i);
  assert.match(html, /Seguridad:/i);
  assert.match(html, /Funcionamiento básico:/i);
  assert.match(html, /Logística compartida:/i);
  assert.match(html, /Dolor y preguntas:/i);
  assert.match(html, /qué requiere una acción segura ahora, qué admite una pausa/i);
});

test('el plan inmediato es gradual, legítimo y reversible', () => {
  assert.match(html, /Plan mínimo y reversible para hoy/i);
  assert.match(html, /No entres en cuentas ajenas ni copies información que no te pertenece/i);
  assert.match(html, /Define un único canal práctico/i);
  assert.match(html, /Pospone lo irreversible/i);
  assert.match(html, /Revisa mañana con hechos/i);
});

test('la reorganización práctica distingue acceso propio y decisión conjunta', () => {
  assert.match(html, /Vivienda, dinero y pertenencias: inventario antes que discusión/i);
  assert.match(html, /Distingue <strong>acceso propio<\/strong> de <strong>decisión conjunta<\/strong>/i);
  assert.match(html, /no demuestra que puedas decidir unilateralmente/i);
  assert.match(html, /orientación jurídica aplicable a tu caso y territorio/i);
  assert.match(html, /no sustituyen protección, asesoramiento independiente/i);
});

test('la privacidad digital cubre accesos, permisos, límites y terceras personas', () => {
  assert.match(html, /Privacidad digital después de una ruptura/i);
  assert.match(html, /métodos de recuperación y cierra sesiones abiertas/i);
  assert.match(html, /ubicación, álbumes compartidos, calendarios, nubes/i);
  assert.match(html, /no instales herramientas de seguimiento/i);
  assert.match(html, /(información de hijos|datos de menores) o terceras personas/i);
  assert.match(html, /borrarlo no elimina necesariamente las copias/i);
});

test('la página conserva la precedencia de seguridad y recursos oficiales', () => {
  assert.match(html, /Una ruptura ordinaria y una situación de violencia no requieren el mismo plan/i);
  assert.match(html, /miedo, coacción, violencia/i);
  assert.match(html, /tel:112/);
  assert.match(html, /tel:016/);
  assert.match(html, /600 000 016/);
  assert.match(html, /tel:024/);
  assert.match(html, /Desgracias\.es no es un servicio de emergencias/i);
});

test('la página elimina captación y dependencias externas', () => {
  assert.match(html, /Buscar ayuda por situación/i);
  assert.doesNotMatch(html, /Contar mi historia/i);
  assert.doesNotMatch(html, /href="\/#inicio"/i);
  assert.doesNotMatch(html, /afiliad|publicidad|patrocin/i);
  assert.match(html, /href="\/assets\/home-fonts\.css"/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.match(html, /src="\/public-page-runtime\.js" defer/);
});

test('la página mantiene SEO, fecha y fuentes primarias', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/rupturas\/mi-pareja-me-ha-dejado\/"/);
  assert.match(html, /"dateModified":"2026-10-27"/);
  assert.match(html, /Actualizado el 27 de octubre de 2026/i);
  assert.match(html, /aepd\.es\/areas-de-actuacion\/recomendaciones\/medidas/);
  assert.match(html, /aepd\.es\/areas-de-actuacion\/internet-y-redes-sociales\/protege-tu-privacidad/);
  assert.match(html, /administraciondejusticia\.gob\.es\/mediacion1/);
  assert.match(html, /violenciagenero\.igualdad\.gob\.es\/informacion-3\/recursos\/telefono016/);
  assert.match(html, /sanidad\.gob\.es\/linea024/);
});
