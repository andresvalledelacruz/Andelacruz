import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { URL_OPPORTUNITY_MAP, EXPECTED_PRODUCTION_URL_COUNT } from '../opportunity/url-map.mjs';

const path = '/me-preocupa-que-alguien-pueda-suicidarse/';
const html = fs.readFileSync(new URL('../me-preocupa-que-alguien-pueda-suicidarse/index.html', import.meta.url), 'utf8');
const urgentHtml = fs.readFileSync(new URL('../ayuda-urgente.html', import.meta.url), 'utf8');
const ctx = URL_OPPORTUNITY_MAP[path];

function occurrences(text, regex) {
  return [...text.matchAll(regex)].length;
}

test('URL54 remains a high-risk restricted suicide-prevention support route', () => {
  assert.ok(ctx, 'URL54 must remain mapped');
  assert.equal(ctx.domain, 'suicide_prevention_support');
  assert.equal(ctx.risk, 'high');
  assert.equal(ctx.commercialPolicy, 'restricted');
  assert.deepEqual(ctx.opportunities, [], 'Crisis-support route must not expose commercial opportunities');
  for (const flag of [
    'suicide_prevention',
    'ask_directly',
    'no_automatic_diagnosis',
    'no_method_details',
    'official_resources_first',
    'no_commercial_crisis_cta',
    'emergency_escalation',
    'no_secrecy_when_safety_at_risk',
    'supporter_self_care',
    'safety_override'
  ]) assert.ok(ctx.defaultFlags.includes(flag), `Missing safety flag: ${flag}`);
  assert.equal(EXPECTED_PRODUCTION_URL_COUNT, 60);
});

test('024 and 112 remain highly visible and Spain-first', () => {
  assert.ok(occurrences(html, /href=['\"]tel:024['\"]/g) >= 5, '024 should appear in multiple decision contexts');
  assert.ok(occurrences(html, /href=['\"]tel:112['\"]/g) >= 5, '112 should appear in multiple emergency contexts');
  assert.match(html, /nacional, gratuita, confidencial/i);
  assert.match(html, /familiares y allegados/i);
  assert.match(html, /https:\/\/www\.sanidad\.gob\.es\/linea024\//);
  assert.match(html, /emergencia vital|peligro inmediato/i);
});

test('direct suicide question is protected and myth is corrected', () => {
  assert.match(html, /¿estás pensando en suicidarte o en hacerte daño\?/i);
  assert.match(html, /preguntar directamente no provoca que una persona actúe/i);
  assert.match(html, /puede reducir ansiedad/i);
  assert.match(html, /no conviertas la conversación en un interrogatorio/i);
});

test('page does not turn warning signs into an automatic diagnosis', () => {
  assert.match(html, /No existe una señal aislada que permita predecir un suicidio/i);
  assert.match(html, /Una señal no significa que vaya a suicidarse/i);
  assert.match(html, /no puede determinar desde fuera el nivel de riesgo/i);
  assert.match(html, /no diagnostica/i);
  assert.match(html, /no calcula una probabilidad individual/i);
});

test('immediate-safety boundaries remain explicit', () => {
  assert.match(html, /No la dejes sola si estás con ella/i);
  assert.match(html, /No prometas guardar secreto si la seguridad está en juego/i);
  assert.match(html, /reduce de forma general su acceso a aquello con lo que pudiera hacerse daño/i);
  assert.match(html, /No necesitas investigar ni discutir métodos/i);
  assert.match(html, /si.*peligro inmediato.*112/is);
});

test('remote support, minors, follow-up and supporter self-care remain covered', () => {
  assert.match(html, /Si estás lejos o solo tienes contacto por teléfono o mensajes/i);
  assert.match(html, /Si la persona que te preocupa es menor de edad/i);
  assert.match(html, /Cuando la crisis inmediata parece haber pasado/i);
  assert.match(html, /Tú también necesitas apoyo/i);
  assert.match(html, /Nadie debería convertirse en el único sistema de seguridad/i);
});

test('official evidence set remains present and international guidance stays subordinate', () => {
  assert.match(html, /https:\/\/portal\.guiasalud\.es\/gpc\/conducta-suicida\//);
  assert.match(html, /gpc_481_conducta_suicida_avaliat_resum\.pdf/);
  assert.match(html, /https:\/\/www\.who\.int\/es\/news-room\/questions-and-answers\/item\/suicide/);
  assert.match(html, /https:\/\/www\.sspa\.juntadeandalucia\.es\/servicioandaluzdesalud\/el-sas\/servicios-y-centros\/salud-mental\/prevencion-del-suicidio/);
  assert.match(html, /fuentes oficiales españolas prioritarias/i);
  assert.match(html, /vías de ayuda y emergencia españolas tienen prioridad/i);
});

test('public-benefit page has no conversion CTA and bridges safely to postvention', () => {
  assert.ok(html.length > 20_000, `Guide unexpectedly short: ${html.length} chars`);
  assert.doesNotMatch(html, /class=['\"]cta['\"]/i);
  assert.doesNotMatch(html, /href=['\"]\/#inicio['\"]/i);
  assert.match(html, /no ofrece servicios comerciales alrededor de una emergencia/i);
  assert.match(html, /href=['\"]\/duelo\/ha-muerto-por-suicidio-alguien-que-quiero\/['\"]/i);
  assert.match(urgentHtml, /href=['\"]\/me-preocupa-que-alguien-pueda-suicidarse\/['\"]/i);
});

test('all external evidence links use safe rel attributes', () => {
  const externalAnchors = [...html.matchAll(/<a\s+[^>]*href=['\"]https?:\/\/[^'\"]+['\"][^>]*>/gi)].map(match => match[0]);
  assert.ok(externalAnchors.length >= 5, 'Expected primary Spanish and WHO evidence links');
  for (const anchor of externalAnchors) {
    assert.match(anchor, /rel=['\"]noopener noreferrer['\"]/i, `Unsafe external link: ${anchor}`);
  }
});
