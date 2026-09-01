import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../rupturas/no-puedo-dejar-de-pensar-en-mi-ex/index.html', import.meta.url), 'utf8');

test('la guía evita convertir atención y recuerdos en pruebas sobre volver', () => {
  assert.match(html, /Tu atención no es una prueba sobre la relación/i);
  assert.match(html, /no demuestra por sí solo que sea tu única pareja posible ni que debas actuar/i);
  assert.match(html, /Recordar no es lo mismo que querer volver/i);
});

test('la guía separa reflexión de rumiación y hechos de hipótesis', () => {
  assert.match(html, /Reflexionar y rumiar no son exactamente lo mismo/i);
  assert.match(html, /“lo que sé”/i);
  assert.match(html, /“lo que estoy intentando adivinar”/i);
});

test('los cambios digitales se plantean como reversibles y no como prohibiciones absolutas', () => {
  assert.match(html, /Estas medidas son <strong>reversibles<\/strong>/i);
  assert.match(html, /No tienes que decidir hoy/i);
  assert.match(html, /romper la respuesta automática/i);
});

test('la guía separa contacto práctico de riesgo y conserva emergencia', () => {
  assert.match(html, /Hijos, vivienda, mascotas, trámites o cuestiones económicas/i);
  assert.match(html, /acoso, amenazas, control, miedo o violencia/i);
  assert.match(html, /tel:112/);
  assert.match(html, /tel:024/);
  assert.match(html, /Desgracias\.es no es un servicio de emergencias/i);
});

test('la página conserva canonical y límite no diagnóstico', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/rupturas\/no-puedo-dejar-de-pensar-en-mi-ex\/"/);
  assert.match(html, /evita presentar una experiencia común tras una ruptura como un diagnóstico/i);
});
