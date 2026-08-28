import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { URL_OPPORTUNITY_MAP } from '../opportunity/url-map.mjs';

const path = '/duelo/ha-muerto-por-suicidio-alguien-que-quiero/';
const html = fs.readFileSync(new URL('../duelo/ha-muerto-por-suicidio-alguien-que-quiero/index.html', import.meta.url), 'utf8');
const ctx = URL_OPPORTUNITY_MAP[path];

function occurrencesByRegex(text, regex) {
  return [...text.matchAll(regex)].length;
}

test('suicide bereavement route remains a high-risk restricted postvention page', () => {
  assert.ok(ctx, 'URL 53 must remain mapped');
  assert.equal(ctx.domain, 'suicide_bereavement');
  assert.equal(ctx.risk, 'high');
  assert.equal(ctx.commercialPolicy, 'restricted');
  for (const flag of [
    'suicide_postvention',
    'no_causal_attribution',
    'no_automatic_diagnosis',
    'no_method_details',
    'official_resources_first',
    'no_commercial_crisis_cta',
    'safety_override'
  ]) assert.ok(ctx.defaultFlags.includes(flag), `Missing safety flag: ${flag}`);
});

test('page keeps official crisis resources visible more than once', () => {
  assert.ok(occurrencesByRegex(html, /href=['\"]tel:024['\"]/g) >= 3, '024 must be visible in multiple safety contexts');
  assert.ok(occurrencesByRegex(html, /href=['\"]tel:112['\"]/g) >= 3, '112 must be visible in multiple safety contexts');
  assert.match(html, /https:\/\/www\.sanidad\.gob\.es\/linea024\/home\.htm/);
  assert.match(html, /https:\/\/www\.sanidad\.gob\.es\/gabinete\/notasPrensa\.do\?id=6878/);
  assert.match(html, /204\.449 atenciones/);
  assert.match(html, /no equivale al número de personas atendidas/i);
  assert.match(html, /gratuito, confidencial/i);
  assert.match(html, /peligro inmediato|emergencia vital/i);
});

test('page retains primary Spanish evidence and postvention resources', () => {
  assert.match(html, /https:\/\/www\.ine\.es\/dyngs\/Prensa\/pEDCM2025\.htm/);
  assert.match(html, /Plan_de_accion_para_la_prevencion_del_suicidio_2025_2027\.pdf/);
  assert.match(html, /https:\/\/www\.comunidad\.madrid\/publicacion\/ref\/20325/);
  assert.match(html, /https:\/\/www\.redaipis\.org\/asociaciones-en-duelo-por-suicidio/);
  assert.match(html, /https:\/\/papageno\.es\/grupos-de-duelo/);
  assert.match(html, /https:\/\/tdssuicidio\.com\/es\/guias-para-supervivientes-de-un-suicidio/);
  assert.match(html, /recursos oficiales españoles tienen prioridad|prioriza recursos oficiales españoles/i);
});

test('international expert audit remains visible and subordinate to Spanish care', () => {
  assert.match(html, /https:\/\/www\.who\.int\/publications\/i\/item\/9789240116078/);
  assert.match(html, /https:\/\/www\.who\.int\/news-room\/questions-and-answers\/item\/suicide/);
  assert.match(html, /https:\/\/www\.nhs\.uk\/mental-health\/feelings-symptoms-behaviours\/feelings-and-symptoms\/grief-bereavement-loss/);
  assert.match(html, /https:\/\/www\.samaritans\.org\/about-samaritans\/research-policy\/internet-suicide/);
  assert.match(html, /https:\/\/afsp\.org\/ive-lost-someone/);
  assert.match(html, /https:\/\/standbysupport\.com\.au\/resources/);
  assert.match(html, /no sustituyen el sistema español de ayuda|no para sustituir los recursos españoles/i);
});

test('page protects direct safety-question guidance', () => {
  assert.match(html, /¿Estás pensando en hacerte daño o en morir\?/i);
  assert.match(html, /preguntar directamente por suicidio no «mete la idea en la cabeza»/i);
  assert.match(html, /no provoca que actúe/i);
  assert.match(html, /puede ayudar a que se sienta comprendida/i);
  assert.match(html, /si existe peligro inmediato o una emergencia vital/i);
});

test('page covers digital legacy and physical grief without diagnosing', () => {
  assert.match(html, /Redes sociales, mensajes, fotos y memoria digital/i);
  assert.match(html, /no tienes que decidirlo todo ahora/i);
  assert.match(html, /no describir métodos|sin describir métodos|evita detalles del método/i);
  assert.match(html, /Tu cuerpo también puede estar atravesando el impacto/i);
  for (const term of ['sueño', 'apetito', 'concentración', 'agotamiento']) assert.match(html, new RegExp(term, 'i'));
  assert.match(html, /No atribuyas automáticamente un síntoma físico al duelo/i);
});

test('page remains a substantial public-benefit guide without conversion CTA', () => {
  assert.ok(html.length > 30_000, `Flagship guide unexpectedly short: ${html.length} chars`);
  assert.doesNotMatch(html, /class=['\"]cta['\"]/i);
  assert.doesNotMatch(html, /href=['\"]\/#inicio['\"]/i);
  assert.match(html, /no atribuye la causa de un suicidio individual/i);
  assert.match(html, /no describe métodos/i);
  assert.match(html, /no sustituye atención sanitaria/i);
  assert.match(html, /El apoyo no debería terminar después del funeral/i);
});

test('external resource links use safe rel attributes', () => {
  const externalAnchors = [...html.matchAll(/<a\s+[^>]*href=['\"]https?:\/\/[^'\"]+['\"][^>]*>/gi)].map(match => match[0]);
  assert.ok(externalAnchors.length >= 20, 'Expected a broad Spanish and international evidence set');
  for (const anchor of externalAnchors) {
    assert.match(anchor, /rel=['\"]noopener noreferrer['\"]/i, `Unsafe external link: ${anchor}`);
  }
});
