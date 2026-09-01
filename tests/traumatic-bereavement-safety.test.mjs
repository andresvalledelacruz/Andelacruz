import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../duelo/la-muerte-fue-inesperada-o-traumatica/index.html', import.meta.url), 'utf8');

test('separa duelo por la persona del impacto por cómo ocurrió', () => {
  assert.match(html, /dos capas pueden mezclarse/i);
  assert.match(html, /dolor por la persona/i);
  assert.match(html, /impacto de cómo ocurrió/i);
});

test('distingue hechos, inferencias e imágenes mentales', () => {
  assert.match(html, /hechos confirmados/i);
  assert.match(html, /inferencias/i);
  assert.match(html, /imágenes mentales/i);
});

test('evita sobrediagnóstico y exposición repetitiva', () => {
  assert.match(html, /no permite concluir automáticamente que tengas un trastorno/i);
  assert.match(html, /no necesitas exponerte una y otra vez/i);
  assert.match(html, /no diagnostica trauma, trastorno de estrés postraumático, duelo prolongado, depresión/i);
});

test('mantiene urgencia y límite de servicio', () => {
  assert.match(html, /tel:112/);
  assert.match(html, /tel:024/);
  assert.match(html, /Desgracias\.es no es un servicio de emergencias/i);
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/duelo\/la-muerte-fue-inesperada-o-traumatica\/"/);
});
