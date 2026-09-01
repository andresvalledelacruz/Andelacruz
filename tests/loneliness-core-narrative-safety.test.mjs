import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../soledad/me-siento-solo/index.html', import.meta.url), 'utf8');

test('la guía distingue soledad, aislamiento y conexión sin diagnosticar', () => {
  assert.match(html, /Soledad, aislamiento y conexión no son exactamente lo mismo/i);
  assert.match(html, /soledad<\/strong>, que es una experiencia subjetiva/i);
  assert.match(html, /aislamiento social<\/strong>, que describe una falta objetiva/i);
  assert.match(html, /Estas categorías no son diagnósticos/i);
});

test('la narrativa no reduce la soledad a socializar más ni a personalidad', () => {
  assert.match(html, /Antes de obligarte a “socializar más”/i);
  assert.match(html, /La soledad no debe convertirse automáticamente en una explicación sobre tu personalidad/i);
  assert.match(html, /barreras materiales, no solo emocionales/i);
  assert.match(html, /La solución debe caber en tu vida real/i);
});

test('la guía ofrece acciones graduales y evita convertir rechazo puntual en sentencia', () => {
  assert.match(html, /trabaja con las próximas horas/i);
  assert.match(html, /No conviertas una respuesta en un veredicto/i);
  assert.match(html, /busca repetición antes que intensidad/i);
  assert.match(html, /este entorno no me funcionó/i);
});

test('la guía conserva Safety de crisis y límite profesional', () => {
  assert.match(html, /tel:112/);
  assert.match(html, /tel:024/);
  assert.match(html, /Desgracias\.es no es un servicio de emergencias/i);
  assert.match(html, /no permite diagnosticar por sí mismo depresión, ansiedad u otro problema de salud mental/i);
  assert.match(html, /No todo problema de soledad necesita una respuesta clínica/i);
});

test('la página mantiene canonical y evidencia OMS vigente', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/soledad\/me-siento-solo\/"/);
  assert.match(html, /who\.int\/news-room\/questions-and-answers\/item\/social-connection/);
  assert.match(html, /who\.int\/publications\/i\/item\/978240112360/);
  assert.match(html, /Actualizado el 2 de septiembre de 2026/i);
});
