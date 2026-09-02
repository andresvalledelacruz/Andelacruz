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

test('rechaza controles de formulario sin etiqueta accesible', () => {
  const errors = auditHtml(base('<input id="nombre" type="text"><select id="tema"><option>Duelo</option></select><textarea id="mensaje"></textarea>'));
  assert.ok(errors.some((e) => e.includes('input sin etiqueta accesible: nombre')));
  assert.ok(errors.some((e) => e.includes('select sin etiqueta accesible: tema')));
  assert.ok(errors.some((e) => e.includes('textarea sin etiqueta accesible: mensaje')));
});

test('acepta labels explícitos, envolventes y nombres ARIA en formularios', () => {
  const html = base('<label for="nombre">Nombre</label><input id="nombre" type="text"><label>Tema<select id="tema"><option>Duelo</option></select></label><span id="mensaje-label">Mensaje</span><textarea id="mensaje" aria-labelledby="mensaje-label"></textarea><input type="hidden" name="csrf" value="x">');
  assert.deepEqual(auditHtml(html), []);
});

test('rechaza elementos focalizables ocultos del árbol de accesibilidad', () => {
  const errors = auditHtml(base('<a href="/ayuda" aria-hidden="true">Ayuda</a><button aria-hidden="true">Continuar</button><div tabindex="0" aria-hidden="true">Panel</div>'));
  assert.ok(errors.some((e) => e.includes('elemento focalizable oculto con aria-hidden="true": a')));
  assert.ok(errors.some((e) => e.includes('elemento focalizable oculto con aria-hidden="true": button')));
  assert.ok(errors.some((e) => e.includes('elemento focalizable oculto con aria-hidden="true": div')));
});

test('rechaza descendientes focalizables dentro de un ancestro aria-hidden', () => {
  const errors = auditHtml(base('<section aria-hidden="true"><div><a href="/ayuda">Ayuda</a><button>Continuar</button><input aria-label="Buscar" type="text"></div></section>'));
  assert.ok(errors.some((e) => e.includes('elemento focalizable dentro de ancestro aria-hidden="true": a')));
  assert.ok(errors.some((e) => e.includes('elemento focalizable dentro de ancestro aria-hidden="true": button')));
  assert.ok(errors.some((e) => e.includes('elemento focalizable dentro de ancestro aria-hidden="true": input')));
});

test('permite aria-hidden en subárboles sin descendientes focalizables', () => {
  const html = base('<section aria-hidden="true"><div><svg></svg><span>Decoración</span></div></section>');
  assert.deepEqual(auditHtml(html), []);
});

test('permite aria-hidden en decoración no focalizable y controles deshabilitados', () => {
  const html = base('<svg aria-hidden="true"></svg><span aria-hidden="true">Decoración</span><button aria-hidden="true" disabled>Deshabilitado</button><input type="hidden" aria-hidden="true">');
  assert.deepEqual(auditHtml(html), []);
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
