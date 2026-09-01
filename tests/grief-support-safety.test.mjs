import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../duelo/quiero-ayudar-a-alguien-que-esta-de-duelo/index.html', import.meta.url), 'utf8');

test('la guía acompaña sin dirigir ni diagnosticar el duelo', () => {
  assert.match(html, /hacer camino a su lado sin apropiarte de su proceso/i);
  assert.match(html, /no necesitas convertirte en terapeuta/i);
  assert.match(html, /no puede diagnosticar duelo prolongado, depresión, trauma u otro trastorno/i);
});

test('la guía conserva autonomía y evita imponer significado o espiritualidad', () => {
  assert.match(html, /no es necesario imponer explicaciones, creencias ni significados/i);
  assert.match(html, /dar opciones conserva su control/i);
  assert.match(html, /Antes de asumir tareas, pregunta/i);
});

test('la guía contempla pérdidas secundarias y límites de quien acompaña', () => {
  assert.match(html, /Cambian rutinas, roles familiares, ingresos, vivienda, cuidados, tareas, proyectos/i);
  assert.match(html, /El apoyo necesita continuidad, no intensidad permanente/i);
  assert.match(html, /acompañar no exige esconder tu dolor/i);
});

test('riesgo suicida mantiene el carril urgente y los límites del servicio', () => {
  assert.match(html, /tel:112/);
  assert.match(html, /tel:024/);
  assert.match(html, /no es un servicio de emergencias ni supervisa historias de forma continua/i);
});

test('la página conserva canonical y trazabilidad editorial del corpus', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/duelo\/quiero-ayudar-a-alguien-que-esta-de-duelo\/"/);
  assert.match(html, /corpus documental de Desgracias\.es sobre acompañamiento y necesidades del doliente/i);
});
