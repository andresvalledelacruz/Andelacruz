import test from 'node:test';
import assert from 'node:assert/strict';
import { auditHtml } from '../scripts/audit-accessibility.mjs';

const base = (body) => `<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main><h1>Título</h1>${body}</main></body></html>`;

test('acepta HTML con guardrails básicos de accesibilidad', () => {
  assert.deepEqual(auditHtml(base('<img src="x.jpg" alt="Descripción"><a href="/">Inicio</a><button>Continuar</button>')), []);
});

test('detecta imagen sin alt y controles sin nombre accesible', () => {
  const errors = auditHtml(base('<img src="x.jpg"><a href="/"><svg aria-hidden="true"></svg></a><button><svg aria-hidden="true"></svg></button>'));
  assert.ok(errors.some((e) => e.includes('imagen sin atributo alt')));
  assert.ok(errors.some((e) => e.includes('enlace con href sin nombre accesible')));
  assert.ok(errors.some((e) => e.includes('botón sin nombre accesible')));
});

test('rechaza tabindex positivo, autofocus y aria-controls roto', () => {
  const errors = auditHtml(base('<button tabindex="2" autofocus aria-controls="panel">Abrir</button>'));
  assert.ok(errors.some((e) => e.includes('tabindex positivo')));
  assert.ok(errors.some((e) => e.includes('autofocus')));
  assert.ok(errors.some((e) => e.includes('aria-controls referencia id inexistente')));
});

test('rechaza ids duplicados porque rompen referencias ARIA y fragmentos', () => {
  const errors = auditHtml(base('<section id="ayuda">Uno</section><aside id="ayuda">Dos</aside>'));
  assert.ok(errors.some((e) => e.includes('id duplicado no permitido: ayuda')));
});

test('rechaza aria-labelledby y aria-describedby que apuntan a ids inexistentes', () => {
  const errors = auditHtml(base('<section aria-labelledby="titulo-a titulo-b" aria-describedby="detalle"><h2 id="titulo-a">Ayuda</h2></section>'));
  assert.ok(errors.some((e) => e.includes('aria-labelledby referencia id inexistente: titulo-b')));
  assert.ok(errors.some((e) => e.includes('aria-describedby referencia id inexistente: detalle')));
});

test('acepta múltiples referencias ARIA cuando todos los ids existen', () => {
  const html = base('<h2 id="titulo-a">Ayuda</h2><p id="detalle">Descripción</p><section aria-labelledby="titulo-a" aria-describedby="detalle"></section>');
  assert.deepEqual(auditHtml(html), []);
});

test('exige noopener y noreferrer en target blank', () => {
  const errors = auditHtml(base('<a href="https://example.org" target="_blank" rel="noopener">Fuente</a>'));
  assert.ok(errors.some((e) => e.includes('target="_blank"')));
});
