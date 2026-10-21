import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../soledad/no-tengo-amigos/index.html', import.meta.url), 'utf8');

test('la guía distingue necesidades de amistad sin diagnosticar ni culpabilizar', () => {
  assert.match(html, /no siempre significa lo mismo/i);
  assert.match(html, /ausencia de compañía, de confianza, de reciprocidad o de pertenencia/i);
  assert.match(html, /Estas distinciones no son diagnósticos/i);
  assert.match(html, /sin presentar la falta de amigos como un defecto de personalidad/i);
});

test('la narrativa incorpora barreras materiales y un proceso gradual verificable', () => {
  assert.match(html, /transporte, el dinero, la movilidad, los turnos o los cuidados/i);
  assert.match(html, /La oportunidad de conexión debe caber en tu vida real/i);
  assert.match(html, /Convierte presencia en familiaridad/i);
  assert.match(html, /Observa reciprocidad con tiempo/i);
  assert.match(html, /experimento de cuatro semanas/i);
  assert.match(html, /Mide oportunidades creadas, conversaciones repetidas, propuestas y reciprocidad/i);
});

test('la guía protege frente a rechazo, vínculos inseguros y riesgos digitales', () => {
  assert.match(html, /Una respuesta fría no es una sentencia sobre ti/i);
  assert.match(html, /No estás obligado a recuperar relaciones/i);
  assert.match(html, /violentas o inseguras/i);
  assert.match(html, /Protege dirección, documentos, contraseñas, dinero e imágenes íntimas/i);
});

test('la guía conserva Safety de crisis, límites y recursos oficiales', () => {
  assert.match(html, /tel:112/);
  assert.match(html, /tel:024/);
  assert.match(html, /Desgracias\.es no es un servicio de emergencias/i);
  assert.match(html, /No tener amigos no diagnostica depresión, ansiedad/i);
  assert.match(html, /No todo problema de amistad necesita una respuesta clínica/i);
  assert.match(html, /no fabrica amistades ni sustituye oportunidades sociales reales/i);
});

test('la página ofrece decisiones y guiones sin presión ni captación de relatos', () => {
  assert.match(html, /Elige el punto de partida/i);
  assert.match(html, /Frases para pasar de coincidir a volver a hablar/i);
  assert.match(html, /Una negativa clara se respeta/i);
  assert.match(html, /Buscar ayuda por situación/i);
  assert.doesNotMatch(html, /Contar mi historia/i);
  assert.doesNotMatch(html, /href="\/#inicio"/i);
  assert.doesNotMatch(html, /afiliad|publicidad|patrocin/i);
});

test('la página mantiene canonical, fuentes y prudencia causal', () => {
  assert.match(html, /rel="canonical" href="https:\/\/desgracias\.es\/soledad\/no-tengo-amigos\/"/);
  assert.match(html, /property="og:description" content="Distingue qué vínculo te falta/i);
  assert.match(html, /who\.int\/publications\/i\/item\/978240112360/);
  assert.match(html, /soledades\.es\/estudios\/barometro-soledad-no-deseada-espana-2024/);
  assert.match(html, /Son asociaciones poblacionales/i);
  assert.match(html, /ni promete que una actividad concreta produzca una amistad/i);
  assert.match(html, /"dateModified":"2026-10-21"/);
  assert.match(html, /Actualizado el 21 de octubre de 2026/i);
  assert.match(html, /imserso\.es\/el-imserso/i);
});
