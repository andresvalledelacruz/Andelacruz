import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('profesionales.html', 'utf8');

test('Italy guidance uses official profession-specific registers', () => {
  assert.match(html, /id="italia"/i);
  assert.match(html, /areariservata\.psy\.it\/albonazionale/i);
  assert.match(html, /albounico\.fnomceo\.it/i);
  assert.match(html, /consiglionazionaleforense\.it\/ricerca-avvocato/i);
  assert.match(html, /salute\.gov\.it\/new\/it\/tema\/riconoscimento-qualifiche-professioni-sanitarie/i);
});

test('Italy guidance separates recognition, registration and specialty', () => {
  assert.match(html, /título declarado.+reconocimiento de una cualificación extranjera.+inscripción profesional vigente.+especialidad.+territorio del servicio/is);
  assert.match(html, /resolución de reconocimiento y una inscripción profesional son comprobaciones relacionadas pero distintas/i);
  assert.match(html, /especialidad registrada separada de áreas de experiencia declaradas/i);
  assert.match(html, /no se rellena por inferencia/i);
});

test('Italy expansion does not imply recommendation or activate the directory', () => {
  assert.match(html, /No crean una recomendación de Desgracias\.es/i);
  assert.match(html, /no activan el directorio/i);
  assert.match(html, /El directorio de profesionales todavía no está disponible/i);
  assert.doesNotMatch(html, /profesional recomendado|alta garantizada|resultado garantizado/i);
});

test('Italy section is reachable from the professional guide navigation', () => {
  assert.match(html, /href="#italia">Comprobaciones en Italia<\/a>/i);
  assert.equal((html.match(/id="italia"/gi) || []).length, 1);
});

test('Italian vocabulary helps prepare a consultation without translating credentials', () => {
  for (const term of ['credenziali professionali', 'preventivo', 'condizioni di cancellazione', 'lingua del servizio']) {
    assert.match(html, new RegExp(`<span lang="it">${term}<\\/span>`, 'i'), term);
  }
  assert.match(html, /No traducen títulos regulados, acreditan profesiones ni anuncian atención disponible/i);
});
