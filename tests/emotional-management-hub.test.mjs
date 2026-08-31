import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../gestion-emocional/index.html', import.meta.url), 'utf8');

test('Gestión emocional tiene identidad, canonical e indexación propios', () => {
  assert.match(html, /<title>Gestión emocional:/);
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/gestion-emocional\/"/);
  assert.match(html, /name="robots" content="index,follow/);
});

test('el hub deriva a causas específicas sin canibalizarlas', () => {
  for (const href of ['/soledad/', '/rupturas/', '/duelo/', '/familia/', '/trabajo/', '/dinero/']) {
    assert.ok(html.includes(`href="${href}`), `missing route: ${href}`);
  }
});

test('el hub mantiene límites no diagnósticos y puente de seguridad', () => {
  assert.match(html, /no intenta diagnosticar/i);
  assert.match(html, /tel:112/);
  assert.match(html, /tel:024/);
  assert.match(html, /no es un servicio de emergencias/i);
});

test('las fuentes primarias vigentes y el runtime público permanecen visibles', () => {
  assert.match(html, /who\.int\/es\/publications\/b\/53604/);
  assert.match(html, /who\.int\/es\/news-room\/questions-and-answers\/item\/stress/);
  assert.match(html, /sanidad\.gob\.es\/areas\/calidadAsistencial\/estrategias\/saludMental/);
  assert.match(html, /sanidad\.gob\.es\/linea024/);
  assert.match(html, /<script src="\/public-page-runtime\.js" async><\/script>/);
});
