import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const discovery = fs.readFileSync('DISCOVERY_INTELLIGENCE.md', 'utf8');
const disappearance = fs.readFileSync('DISAPPEARANCE_INTELLIGENCE.md', 'utf8');
const endOfLife = fs.readFileSync('END_OF_LIFE_EUTHANASIA_INTELLIGENCE.md', 'utf8');
const international = fs.readFileSync('INTERNATIONAL_LOCALIZATION_INTELLIGENCE.md', 'utf8');

test('disappearance intelligence stays fail-closed for sensitive public URLs', () => {
  assert.match(disappearance, /Publicación: HOLD/);
  assert.match(disappearance, /sin monetización ni CTA comercial/);
  assert.match(disappearance, /no asumir que procedimientos, plazos o canales españoles aplican fuera de España/i);
  assert.match(disappearance, /no especulación sobre causa o voluntad/i);
});

test('end-of-life intelligence does not become self-harm instructions', () => {
  assert.match(endOfLife, /no ofrece instrucciones para provocar una muerte/);
  assert.match(endOfLife, /no determina elegibilidad/);
  assert.match(endOfLife, /no recomienda solicitar eutanasia/);
  assert.match(endOfLife, /activar el carril Safety correspondiente/i);
  assert.match(endOfLife, /Publicación: HOLD/);
});

test('international capture is concurrent but never automatic localization', () => {
  assert.match(international, /toda investigación temática realizada para España debe producir en paralelo/i);
  assert.match(international, /no equivale a traducción ni autoriza publicación/i);
  assert.match(international, /Prohibición de herencia automática/);
});

test('Discovery records both new fronts and the transversal international rule', () => {
  assert.match(discovery, /Desapariciones de personas y animales/);
  assert.match(discovery, /Final de vida, eutanasia y prestación de ayuda para morir/);
  assert.match(discovery, /Regla internacional transversal/);
});
