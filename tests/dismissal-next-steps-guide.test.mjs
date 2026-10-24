import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html = readFileSync('trabajo/me-han-despedido-y-no-se-que-hacer/index.html', 'utf8');
const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('separa las seis intenciones principales tras un despido', () => {
  for (const phrase of [
    'Acaba de ocurrir',
    'No estoy de acuerdo',
    'Necesito solicitar el paro',
    'No entiendo lo que me pagan',
    'Me preocupa llegar a fin de mes',
    'Quiero encontrar otro empleo'
  ]) assert.match(text, new RegExp(phrase, 'i'));
});

test('explica el plazo general sin decidir jurídicamente el caso', () => {
  assert.match(text, /veinte días hábiles/i);
  assert.match(text, /plazo como de caducidad/i);
  assert.match(text, /no se computan sábados, domingos ni festivos/i);
  assert.match(text, /no puede declarar el despido procedente, improcedente o nulo/i);
  assert.match(html, /boe\.es\/buscar\/act\.php\?id=BOE-A-2011-15936/);
});

test('distingue impugnación y prestación por desempleo', () => {
  assert.match(text, /Prestación por desempleo e impugnación no son el mismo trámite/i);
  assert.match(text, /no exige impugnar el despido solo para pedirla/i);
  assert.match(text, /inscrito como demandante de empleo/i);
  assert.match(text, /certificado de empresa/i);
  assert.match(html, /sepe\.es\/HomeSepe\/prestaciones-desempleo/);
});

test('diferencia finiquito indemnización y protección pública', () => {
  assert.match(text, /Finiquito, indemnización y prestación: tres conceptos diferentes/i);
  assert.match(text, /FOGASA no sustituye automáticamente a la empresa/i);
  assert.match(text, /situación de insolvencia o concurso/i);
  assert.match(html, /mites\.gob\.es\/fogasa\/faqs\.html/);
});

test('protege datos y excluye captación e integraciones no aprobadas', () => {
  assert.match(text, /No envíes estos documentos a Desgracias\.es ni los publiques/i);
  assert.match(text, /No introduzcas empresa, nombres, DNI, cuenta, expediente ni información médica/i);
  assert.doesNotMatch(html, /Contar mi historia|#inicio|fonts\.googleapis|fonts\.gstatic/i);
  assert.doesNotMatch(html, /adsbygoogle|awin|adtraction|financeads|affiliate|lead-form|solicita presupuesto/i);
});

test('mantiene safety, canonical y fecha editorial sincronizada', () => {
  assert.match(html, /href="tel:112"/);
  assert.match(html, /href="tel:024"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/desgracias\.es\/trabajo\/me-han-despedido-y-no-se-que-hacer\/">/);
  assert.match(html, /"dateModified":"2026-10-24"/);
  const sitemap = readFileSync('sitemap.xml', 'utf8');
  const entries = [...sitemap.matchAll(/<url><loc>https:\/\/desgracias\.es\/trabajo\/me-han-despedido-y-no-se-que-hacer\/<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g)];
  assert.equal(entries.length, 1);
  assert.equal(entries[0][1], '2026-10-24');
});
