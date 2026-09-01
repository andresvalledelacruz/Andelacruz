import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../duelo/ha-muerto-mi-mascota-y-estoy-destrozado/index.html', import.meta.url), 'utf8');

test('la guía valida el vínculo sin equiparar ni jerarquizar pérdidas', () => {
  assert.match(html, /No necesitas comparar esta muerte con la de una persona/i);
  assert.match(html, /defender que la pérdida importa/i);
  assert.match(html, /No estás obligado\/a a convencer a nadie/i);
});

test('la culpa por eutanasia se ordena sin emitir juicio veterinario retrospectivo', () => {
  assert.match(html, /No podemos valorar retrospectivamente una decisión veterinaria concreta/i);
  assert.match(html, /lo que sabías entonces/i);
  assert.match(html, /lo que te explicó el equipo veterinario/i);
  assert.match(html, /lo que ahora sabes porque ya conoces el desenlace/i);
});

test('la guía protege a menores y evita convertirles en cuidadores emocionales', () => {
  assert.match(html, /No es necesario dar detalles que no hayan preguntado/i);
  assert.match(html, /responsables de consolar a los adultos/i);
  assert.match(html, /orientación profesional adecuada a su edad/i);
});

test('la página conserva límites profesionales, canonical y carril de emergencia', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/duelo\/ha-muerto-mi-mascota-y-estoy-destrozado\/"/);
  assert.match(html, /No sustituye atención veterinaria, sanitaria, psicológica ni de emergencia/i);
  assert.match(html, /tel:112/);
  assert.match(html, /tel:024/);
  assert.match(html, /no es un servicio de emergencias ni supervisa historias de forma continua/i);
});
