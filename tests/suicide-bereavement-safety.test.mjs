import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { URL_OPPORTUNITY_MAP } from '../opportunity/url-map.mjs';

const path = '/duelo/ha-muerto-por-suicidio-alguien-que-quiero/';
const html = fs.readFileSync(new URL('../duelo/ha-muerto-por-suicidio-alguien-que-quiero/index.html', import.meta.url), 'utf8');
const ctx = URL_OPPORTUNITY_MAP[path];

function occurrences(text, needle) {
  return text.split(needle).length - 1;
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
  assert.ok(occurrences(html, 'href="tel:024"') >= 3, '024 must be visible in multiple safety contexts');
  assert.ok(occurrences(html, 'href="tel:112"') >= 3, '112 must be visible in multiple safety contexts');
  assert.match(html, /https:\/\/www\.sanidad\.gob\.es\/linea024\/home\.htm/);
  assert.match(html, /gratuito, confidencial/i);
  assert.match(html, /peligro inmediato|emergencia vital/i);
});

test('page retains primary evidence and postvention resources', () => {
  assert.match(html, /https:\/\/www\.ine\.es\/dyngs\/Prensa\/pEDCM2025\.htm/);
  assert.match(html, /Plan_de_accion_para_la_prevencion_del_suicidio_2025_2027\.pdf/);
  assert.match(html, /https:\/\/www\.comunidad\.madrid\/publicacion\/ref\/20325/);
  assert.match(html, /https:\/\/www\.redaipis\.org\/asociaciones-en-duelo-por-suicidio/);
  assert.match(html, /https:\/\/papageno\.es\/grupos-de-duelo/);
  assert.match(html, /https:\/\/tdssuicidio\.com\/es\/guias-para-supervivientes-de-un-suicidio/);
});

test('page remains a substantial public-benefit guide without conversion CTA', () => {
  assert.ok(html.length > 30_000, `Flagship guide unexpectedly short: ${html.length} chars`);
  assert.doesNotMatch(html, /class="cta"/i);
  assert.doesNotMatch(html, /href="\/#inicio"/i);
  assert.match(html, /no atribuye la causa de un suicidio individual/i);
  assert.match(html, /no describe métodos/i);
  assert.match(html, /no sustituye atención sanitaria/i);
});

test('external resource links use safe rel attributes', () => {
  const externalAnchors = [...html.matchAll(/<a\s+[^>]*href="https?:\/\/[^\"]+"[^>]*>/gi)].map(match => match[0]);
  assert.ok(externalAnchors.length >= 10, 'Expected a broad source/resource set');
  for (const anchor of externalAnchors) {
    assert.match(anchor, /rel="noopener noreferrer"/i, `Unsafe external link: ${anchor}`);
  }
});
