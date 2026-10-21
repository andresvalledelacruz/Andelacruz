import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../ansiedad/index.html', import.meta.url), 'utf8');
const cards = JSON.parse(await readFile(new URL('../content/resource-card-options.json', import.meta.url), 'utf8'))['ansiedad/index.html'];
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');

test('la guía de ansiedad separa episodio, patrón y posible causa física sin diagnosticar', () => {
  assert.match(html, /algo nuevo, un episodio intenso o un patrón que se repite/i);
  assert.match(html, /no convierte cada síntoma en ansiedad ni permite descartar una causa física/i);
  assert.match(html, /no puede observarte, explorarte ni distinguir a distancia entre ansiedad y una urgencia médica/i);
  assert.match(html, /no consta revisión clínica individual externa/i);
});

test('la orientación inmediata conserva seguridad y evita cambios clínicos improvisados', () => {
  assert.match(html, /conduciendo, usando maquinaria, en altura/i);
  assert.match(html, /No empieces, suspendas ni cambies un tratamiento/i);
  assert.match(html, /no uses alcohol u otras sustancias como sustituto de valoración/i);
  assert.match(html, /href="tel:112"/i);
  assert.match(html, /href="tel:024"/i);
  assert.match(html, /El 024 no es una línea general para cualquier problema de ansiedad/i);
});

test('la guía prepara acceso sanitario y distingue causas sociales', () => {
  assert.match(html, /atención primaria incluye detección, diagnóstico y tratamiento de algunos problemas de ansiedad/i);
  assert.match(html, /Inicio y evolución/i);
  assert.match(html, /Si hay un problema externo, regular la emoción no lo sustituye/i);
  assert.match(html, /href="\/violencia\/"/i);
  assert.match(html, /href="\/gestion-emocional\/"/i);
});

test('la ampliación no introduce captación ni comercio sensible', () => {
  assert.doesNotMatch(html, /adsbygoogle|awin|adtraction|financeads|afiliad[oa]|solicita presupuesto|contrata ahora/i);
  assert.doesNotMatch(html, /<form\b/i);
  assert.match(html, /no necesitas enviarla a esta web/i);
});

test('tarjetas, metadatos y sitemap quedan sincronizados', () => {
  assert.equal(cards.find(card => card.url === '/ansiedad/#orientacion-1')?.title, '¿Es algo nuevo, un episodio intenso o un patrón que se repite?');
  assert.equal(cards.find(card => card.url === '/ansiedad/#orientacion-2')?.title, 'Qué hacer durante los próximos diez minutos');
  assert.match(html, /"dateModified":"2026-10-21"/);
  assert.match(html, /Actualizado el 21 de octubre de 2026/);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/ansiedad\/<\/loc><lastmod>2026-10-21<\/lastmod>/);
});
