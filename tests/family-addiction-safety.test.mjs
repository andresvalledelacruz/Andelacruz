import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { URL_OPPORTUNITY_MAP, EXPECTED_PRODUCTION_URL_COUNT } from '../opportunity/url-map.mjs';

const path = '/familia/un-familiar-tiene-una-adiccion-y-no-se-como-ayudarle/';
const html = fs.readFileSync(new URL('../familia/un-familiar-tiene-una-adiccion-y-no-se-como-ayudarle/index.html', import.meta.url), 'utf8');
const familyHub = fs.readFileSync(new URL('../familia/index.html', import.meta.url), 'utf8');
const sitemap = fs.readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const ctx = URL_OPPORTUNITY_MAP[path];

test('URL59 remains a high-risk restricted family-addiction route', () => {
  assert.ok(ctx, 'URL59 must remain mapped');
  assert.equal(ctx.domain, 'family_addiction_support');
  assert.equal(ctx.risk, 'high');
  assert.equal(ctx.commercialPolicy, 'restricted');
  assert.deepEqual(ctx.opportunities, [], 'Family-addiction route must not expose commercial opportunities');
  for (const flag of [
    'family_addiction_support', 'no_automatic_diagnosis', 'official_resources_first',
    'no_forced_confrontation', 'family_boundaries', 'financial_safeguarding',
    'minors_safeguarding', 'violence_separation', 'emergency_escalation',
    'suicide_risk_bridge', 'supporter_self_care', 'no_commercial_crisis_cta', 'safety_override'
  ]) assert.ok(ctx.defaultFlags.includes(flag), `Missing safety flag: ${flag}`);
  assert.equal(Object.keys(URL_OPPORTUNITY_MAP).length, EXPECTED_PRODUCTION_URL_COUNT);
});

test('guidance avoids diagnosis and coercive treatment promises', () => {
  assert.match(html, /Una lista de señales en Internet no puede diagnosticar una adicción/i);
  assert.match(html, /La valoración corresponde a profesionales/i);
  assert.match(html, /No existe una frase que garantice que alguien acepte tratamiento/i);
  assert.match(html, /No puedes garantizar el cambio de otro adulto/i);
});

test('public help, boundaries and family safety remain explicit', () => {
  assert.match(html, /Centros de Atención a las Adicciones del Ministerio de Sanidad/i);
  assert.match(html, /atención primaria/i);
  assert.match(html, /Evita entregar dinero/i);
  assert.match(html, /firmar préstamos o asumir deudas bajo presión/i);
  assert.match(html, /La seguridad y los cuidados del menor van primero/i);
  assert.match(html, /Una adicción no justifica amenazas, agresiones ni control coercitivo/i);
});

test('the guide distinguishes situations and turns concern into bounded actions', () => {
  assert.match(html, /alcohol u otras drogas, medicamentos, juego con dinero u otra conducta/i);
  assert.match(html, /Separa lo que viste de lo que te contaron y de lo que estás interpretando/i);
  assert.match(html, /hecho observable/i);
  assert.match(html, /impacto/i);
  assert.match(html, /petición/i);
  assert.match(html, /límite propio/i);
  assert.match(html, /una vez por semana/i);
});

test('financial and gambling guidance protects without impersonation', () => {
  assert.match(html, /alquiler o hipoteca, suministros, alimentación, cuidados y cuentas conjuntas/i);
  assert.match(html, /No entres en cuentas ajenas, no suplantes a la persona/i);
  assert.match(html, /Registro General de Interdicciones de Acceso al Juego/i);
  assert.match(html, /trámite de la propia persona/i);
  assert.match(html, /no sustituye la valoración ni el apoyo profesional/i);
});

test('consultation preparation and provider limits are transparent', () => {
  assert.match(html, /cinco apartados/i);
  assert.match(html, /atiende a familiares aunque la persona preocupante no haya iniciado tratamiento/i);
  assert.match(html, /Esta guía prioriza la red pública y no certifica centros ni profesionales privados/i);
  assert.match(html, /No consta revisión individual de esta página por un profesional externo/i);
  assert.match(html, /dateModified/i);
  assert.match(html, /2026-10-21/i);
});

test('medical and suicide emergencies bridge to official emergency routes', () => {
  assert.match(html, /inconsciente, respira con dificultad, convulsiona/i);
  assert.match(html, /112/i);
  assert.match(html, /024/i);
  assert.match(html, /no la dejes sola/i);
  assert.match(html, /ni provoques el vómito/i);
  assert.match(html, /me-preocupa-que-alguien-pueda-suicidarse/i);
});

test('route remains non-commercial and discoverable', () => {
  assert.doesNotMatch(html, /class=['\"]cta['\"]/i);
  assert.doesNotMatch(html, /href=['\"]\/#inicio['\"]/i);
  assert.doesNotMatch(html, /awin|adtraction|financeads|adsbygoogle|affiliate|afiliad/i);
  assert.match(familyHub, /un-familiar-tiene-una-adiccion-y-no-se-como-ayudarle/i);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/familia\/un-familiar-tiene-una-adiccion-y-no-se-como-ayudarle\/<\/loc><lastmod>2026-10-21<\/lastmod>/i);
  for (const anchor of html.matchAll(/<a\s+[^>]*href=['\"]https?:\/\/[^'\"]+['\"][^>]*>/gi)) {
    assert.match(anchor[0], /rel=['\"]noopener noreferrer['\"]/i, `Unsafe external link: ${anchor[0]}`);
  }
});
