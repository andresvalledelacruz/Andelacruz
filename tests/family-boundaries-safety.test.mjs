import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../familia/necesito-poner-limites-a-mi-familia/index.html', import.meta.url), 'utf8');

test('la guía define límites como conducta propia y evita promesas de control', () => {
  assert.match(html, /Un límite y una orden no son lo mismo/i);
  assert.match(html, /qué respuesta depende de ti/i);
  assert.match(html, /no garantiza que la otra persona lo reciba bien/i);
});

test('la guía contempla dependencia económica, vivienda y cuidados antes de escalar', () => {
  assert.match(html, /dependes de esa persona para vivienda, dinero, transporte, cuidados/i);
  assert.match(html, /el límite tenga que ser gradual/i);
  assert.match(html, /orientación social, jurídica o de mediación/i);
});

test('violencia y represalias activan un carril de seguridad independiente', () => {
  assert.match(html, /prioriza tu seguridad/i);
  assert.match(html, /tel:112/);
  assert.match(html, /tel:016/);
  assert.match(html, /tel:900202010/);
  assert.match(html, /La mediación no debe utilizarse como sustituto de protección/i);
});

test('la página conserva canonical y límites profesionales', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/familia\/necesito-poner-limites-a-mi-familia\/"/);
  assert.match(html, /no sustituyen apoyo psicológico, social, jurídico ni de emergencia/i);
});
