import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync('profesionales.html', 'utf8');
const mail = readFileSync('professional-application-mail.js', 'utf8');

test('German professional guidance separates recognition, registration and recommendation', () => {
  for (const signal of ['Anerkennungs-Finder', 'Bundesärztekammer', 'Bundespsychotherapeutenkammer', 'Bundesweites Amtliches Anwaltsverzeichnis']) {
    assert.match(html, new RegExp(signal, 'i'), signal);
  }
  assert.match(html, /reconocer la cualificación y cumplir los demás requisitos de autorización.+no intercambiables/is);
  assert.match(html, /no demuestra experiencia en un asunto, valida una factura ni garantiza resultados/i);
});

test('German checks use official profession-specific sources and preserve regional scope', () => {
  assert.match(html, /anerkennung-in-deutschland\.de\/en\/interest\/finder\/profession/i);
  assert.match(html, /bundesaerztekammer\.de\/arztsuche/i);
  assert.match(html, /bptk\.de\/patient-innen/i);
  assert.match(html, /brak\.de\/service\/bundesweites-amtliches-anwaltsverzeichnis/i);
  assert.match(html, /Bundesland.+cámara aplicable/is);
  assert.match(html, /no todas las organizaciones están representadas online/i);
});

test('professional application separates establishment, service countries and languages', () => {
  for (const id of ['pro-country', 'pro-area', 'pro-service-countries', 'pro-mode', 'pro-languages']) {
    assert.match(html, new RegExp(`id="${id}"[^>]*required`, 'i'), id);
  }
  assert.match(html, /La atención online o en un idioma no demuestra habilitación territorial/i);
  assert.match(mail, /\['País de establecimiento', 'pro-country'\]/);
  assert.match(mail, /\['Países de prestación declarados', 'pro-service-countries'\]/);
});

test('international expansion does not activate profiles, matching or commercial claims', () => {
  assert.match(html, /El directorio de profesionales todavía no está disponible/i);
  assert.match(html, /Son declaraciones pendientes de revisión/i);
  assert.match(html, /la ficha no se presentará como verificada/i);
  assert.doesNotMatch(html, /profesional recomendado|alta garantizada|resultado garantizado/i);
  assert.doesNotMatch(mail, /fetch\(|XMLHttpRequest|localStorage|sessionStorage|navigator\.clipboard/);
});
