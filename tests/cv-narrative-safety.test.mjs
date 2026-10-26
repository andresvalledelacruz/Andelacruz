import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../trabajo/mi-curriculum-no-funciona/index.html', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
const visibleText = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

test('localiza el problema en el embudo antes de culpar al CV', () => {
  assert.match(html, /Casi no encuentras vacantes adecuadas/i);
  assert.match(html, /Envías muchas candidaturas y no responden/i);
  assert.match(html, /Llegas a entrevistas/i);
  assert.ok(visibleText.split(/\s+/).length >= 1200);
});

test('adapta el CV sin falsedad ni promesas sobre filtros automáticos', () => {
  assert.match(html, /CV base y versiones por familia/i);
  assert.match(html, /sin inventar/i);
  assert.match(html, /no existe un truco universal para .vencer al ATS./i);
  assert.match(html, /Nadie puede garantizar que una plantilla supere todos los filtros/i);
});

test('ofrece un plan temporal concreto y alternativas públicas', () => {
  assert.match(html, /En 30 minutos/i);
  assert.match(html, /En las próximas 72 horas/i);
  assert.match(html, /Durante dos semanas/i);
  assert.match(html, /servicios autonómicos de empleo, SEPE, el portal Empléate/i);
  assert.match(html, /ComPersonal, una autoevaluación anónima/i);
});

test('traduce requisitos a evidencias sin inventar métricas', () => {
  for (const signal of ['mapa de requisitos y evidencias', 'Evidencia propia', 'Resultado comprobable', 'Lugar del CV']) {
    assert.match(html, new RegExp(signal, 'i'), signal);
  }
  assert.match(html, /Si no existe una cifra fiable, no la inventes/i);
  assert.match(html, /Acción \+ contexto \+ evidencia/i);
});

test('incorpora una revisión técnica y control prudente de versiones', () => {
  assert.match(html, /revisión técnica de veinte minutos/i);
  assert.match(html, /abre cada enlace en una ventana privada/i);
  assert.match(html, /selecciona y copia varias líneas del PDF/i);
  assert.match(html, /no para fabricar una tasa universal de éxito/i);
  assert.match(html, /verificadores desconocidos/i);
});

test('contempla barreras reales sin convertirlas en culpa personal', () => {
  assert.match(html, /cuidados, una enfermedad, una discapacidad, la migración o un cambio de sector/i);
  assert.match(html, /no convierten por sí solos tu trayectoria en defectuosa/i);
  assert.match(html, /no puede determinar desde fuera por qué una empresa tomó una decisión/i);
});

test('minimiza datos y protege frente a falsas ofertas', () => {
  assert.match(html, /no necesita incluir DNI, número de la Seguridad Social, datos bancarios/i);
  assert.match(html, /Verifica la empresa por un canal independiente/i);
  assert.match(html, /No pagues para desbloquear una contratación/i);
  assert.match(html, /AEPD/i);
  assert.match(html, /INCIBE/i);
});

test('conserva canonical, entidad Article y fuentes oficiales', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/trabajo\/mi-curriculum-no-funciona\/"/);
  assert.match(html, /"@type":"Article"/);
  assert.match(html, /todofp\.es/);
  assert.match(html, /europass\.europa\.eu/);
  assert.match(html, /sepe\.es/);
  assert.match(html, /empleate\.gob\.es/);
  assert.match(html, /perfiles-de-la-oferta-de-empleo/);
  assert.match(html, /competencias-personales\.html/);
  assert.match(html, /"dateModified":"2026-10-26"/);
  assert.match(sitemap, /mi-curriculum-no-funciona\/<\/loc><lastmod>2026-10-26<\/lastmod>/);
});

test('mantiene límites, carril de crisis y firewall comercial', () => {
  assert.match(html, /No garantiza contratación/i);
  assert.match(html, /tel:024/);
  assert.match(html, /tel:112/);
  assert.doesNotMatch(html, /class="cta"/i);
  assert.doesNotMatch(html, /Contar mi situación/i);
  assert.doesNotMatch(html, /afiliad|comisión|patrocinad|publicidad/i);
});
