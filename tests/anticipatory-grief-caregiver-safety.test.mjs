import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../duelo/mi-familiar-se-esta-muriendo-y-no-se-que-hacer/index.html', import.meta.url), 'utf8');

test('no convierte la guía en pronóstico ni interpretación clínica', () => {
  assert.match(html, /no puede determinar por síntomas aislados/i);
  assert.match(html, /no intentes confirmarlo en Internet/i);
  assert.match(html, /no interpreta síntomas, determina pronósticos, indica tratamientos/i);
});

test('separa plano sanitario, práctico y relacional', () => {
  assert.match(html, /Plano sanitario/i);
  assert.match(html, /Plano práctico/i);
  assert.match(html, /Plano relacional/i);
  assert.match(html, /no tiene por qué ser también la conversación de despedida/i);
});

test('normaliza ambivalencia sin imponer reconciliación ni despedida perfecta', () => {
  assert.match(html, /Acompañar no obliga a borrar la historia/i);
  assert.match(html, /querer a alguien y a la vez estar cansado, enfadado o necesitar límites/i);
  assert.match(html, /no necesitas convertirlo en una gran despedida/i);
});

test('reduce sobrecarga de cuidador mediante reparto concreto', () => {
  assert.match(html, /Reparte tareas concretas/i);
  assert.match(html, /agotarte no es una prueba de amor/i);
  assert.match(html, /Lo que sabemos:/i);
  assert.match(html, /Quién puede asumir qué:/i);
});

test('conserva canonical, fuentes institucionales y límite asistencial', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/duelo\/mi-familiar-se-esta-muriendo-y-no-se-que-hacer\/"/);
  assert.match(html, /sanidad\.gob\.es/);
  assert.match(html, /portal\.guiasalud\.es/);
  assert.match(html, /Desgracias\.es no puede valorar una urgencia médica ni sustituye atención sanitaria/i);
});
