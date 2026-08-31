import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { URL_OPPORTUNITY_MAP, EXPECTED_PRODUCTION_URL_COUNT } from '../opportunity/url-map.mjs';

const path = '/alguien-cercano-ha-intentado-suicidarse/';
const html = fs.readFileSync(new URL('../alguien-cercano-ha-intentado-suicidarse/index.html', import.meta.url), 'utf8');
const ctx = URL_OPPORTUNITY_MAP[path];

function occurrences(text, regex) {
  return [...text.matchAll(regex)].length;
}

test('URL55 remains a high-risk restricted post-attempt family route', () => {
  assert.ok(ctx, 'URL55 must remain mapped');
  assert.equal(ctx.domain, 'suicide_attempt_aftercare_family');
  assert.equal(ctx.risk, 'high');
  assert.equal(ctx.commercialPolicy, 'restricted');
  assert.deepEqual(ctx.opportunities, [], 'Post-attempt family support must not expose commercial opportunities');
  for (const flag of [
    'post_attempt_aftercare',
    'no_automatic_diagnosis',
    'no_method_details',
    'official_resources_first',
    'no_commercial_crisis_cta',
    'continuity_of_care',
    'discharge_plan_first',
    'safety_plan_clinician_led',
    'supporter_self_care',
    'emergency_escalation',
    'no_universal_surveillance',
    'safety_override'
  ]) assert.ok(ctx.defaultFlags.includes(flag), `Missing safety flag: ${flag}`);
  assert.equal(EXPECTED_PRODUCTION_URL_COUNT, 60);
});

test('024 and 112 remain visible across emergency and family-support contexts', () => {
  assert.ok(occurrences(html, /href=['\"]tel:024['\"]/g) >= 5, '024 should appear repeatedly for orientation and renewed risk');
  assert.ok(occurrences(html, /href=['\"]tel:112['\"]/g) >= 5, '112 should appear repeatedly for immediate danger');
  assert.match(html, /nacional, gratuita, confidencial/i);
  assert.match(html, /familiares y allegados/i);
  assert.match(html, /https:\/\/www\.sanidad\.gob\.es\/linea024\//);
  assert.match(html, /emergencia vital|peligro inmediato/i);
});

test('discharge planning and continuity of care stay central', () => {
  assert.match(html, /Antes del alta/i);
  assert.match(html, /qué papel puede tener la familia/i);
  assert.match(html, /cómo se hará el seguimiento/i);
  assert.match(html, /qué hacer si la situación empeora/i);
  assert.match(html, /plan de seguridad/i);
  assert.match(html, /continuidad entre urgencias, atención primaria, salud mental/i);
  assert.match(html, /Alta no significa final del problema/i);
});

test('page rejects false guarantees and universal family surveillance', () => {
  assert.match(html, /nadie puede garantizar una seguridad absoluta/i);
  assert.match(html, /no sustituye una valoración clínica/i);
  assert.match(html, /no existe un calendario universal/i);
  assert.match(html, /no establece un número universal de horas de vigilancia/i);
  assert.match(html, /no eres su terapeuta/i);
  assert.match(html, /no eres su único sistema de seguridad/i);
});

test('communication guidance avoids blame and preserves dignity', () => {
  assert.match(html, /No necesitas empezar con.*¿por qué lo hiciste\?/is);
  assert.match(html, /No tienes que contármelo ahora/i);
  assert.match(html, /Evita frases que culpabilizan/i);
  assert.match(html, /Proteger la seguridad no obliga a eliminar toda privacidad o dignidad/i);
  assert.match(html, /la culpa y las promesas no sustituyen un plan de seguridad ni un tratamiento/i);
});

test('renewed risk bridges to prevention guide and bereavement stays separate', () => {
  assert.match(html, /href=['\"]\/me-preocupa-que-alguien-pueda-suicidarse\/['\"]/i);
  assert.match(html, /href=['\"]\/duelo\/ha-muerto-por-suicidio-alguien-que-quiero\/['\"]/i);
  assert.match(html, /Las tres situaciones no son lo mismo/i);
  assert.match(html, /Si vuelve a existir peligro inmediato/i);
});

test('family crisis and supporter self-care remain explicit', () => {
  assert.match(html, /La familia también puede quedar en crisis/i);
  assert.match(html, /Intentad repartir tareas concretas/i);
  assert.match(html, /Tú tampoco puedes vivir indefinidamente en modo emergencia/i);
  assert.match(html, /Ayudar no significa que la vida de otra persona dependa exclusivamente de ti/i);
  assert.match(html, /tu propia seguridad pasa a ser prioritaria/i);
});

test('page remains substantial, non-commercial and method-safe', () => {
  assert.ok(html.length > 20_000, `Guide unexpectedly short: ${html.length} chars`);
  assert.doesNotMatch(html, /class=['\"]cta['\"]/i);
  assert.doesNotMatch(html, /href=['\"]\/#inicio['\"]/i);
  assert.match(html, /no describe métodos/i);
  assert.match(html, /no ofrece servicios comerciales alrededor de una crisis/i);
  assert.match(html, /no calcula la probabilidad de un nuevo intento/i);
});

test('official post-attempt evidence set remains present and external links are safe', () => {
  assert.match(html, /https:\/\/www3\.gobiernodecanarias\.org\/stopsuicidio\/es\/tras-un-intento-de-suicidio-familiares/);
  assert.match(html, /https:\/\/www\.sspa\.juntadeandalucia\.es\/servicioandaluzdesalud\/dirayabierto\/blog\/2025\/codigo-suicidio-contsui/);
  assert.match(html, /https:\/\/www\.sspa\.juntadeandalucia\.es\/servicioandaluzdesalud\/publicaciones\/guia-sobre-la-prevencion-del-suicidio/);
  assert.match(html, /https:\/\/www\.who\.int\/docs\/default-source\/mental-health\/suicide-prevention-first-responders\.pdf/);
  const externalAnchors = [...html.matchAll(/<a\s+[^>]*href=['\"]https?:\/\/[^'\"]+['\"][^>]*>/gi)].map(match => match[0]);
  assert.ok(externalAnchors.length >= 5, 'Expected a broad public evidence set');
  for (const anchor of externalAnchors) {
    assert.match(anchor, /rel=['\"]noopener noreferrer['\"]/i, `Unsafe external link: ${anchor}`);
  }
});
