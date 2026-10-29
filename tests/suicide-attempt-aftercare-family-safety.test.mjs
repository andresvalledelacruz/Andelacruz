import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { URL_OPPORTUNITY_MAP, EXPECTED_PRODUCTION_URL_COUNT } from '../opportunity/url-map.mjs';

const path = '/alguien-cercano-ha-intentado-suicidarse/';
const html = fs.readFileSync(new URL('../alguien-cercano-ha-intentado-suicidarse/index.html', import.meta.url), 'utf8');
const sitemap = fs.readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
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
  for (const flag of ['post_attempt_aftercare','no_automatic_diagnosis','no_method_details','official_resources_first','no_commercial_crisis_cta','continuity_of_care','discharge_plan_first','safety_plan_clinician_led','supporter_self_care','emergency_escalation','no_universal_surveillance','safety_override']) assert.ok(ctx.defaultFlags.includes(flag), `Missing safety flag: ${flag}`);
  assert.equal(Object.keys(URL_OPPORTUNITY_MAP).length, EXPECTED_PRODUCTION_URL_COUNT);
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

test('private 24-hour coordination executes the clinical plan without becoming surveillance', () => {
  for (const marker of [
    'Una hoja privada para coordinar las próximas 24 horas',
    'Contacto asistencial y próxima cita',
    'Instrucciones autorizadas',
    'Necesidad práctica inmediata',
    'Responsable y relevo',
    'Información que puede compartirse',
    'Próxima revisión'
  ]) assert.match(html, new RegExp(marker, 'i'));
  assert.match(html, /no es una historia clínica, una evaluación de riesgo ni un registro de vigilancia/i);
  assert.match(html, /No la uses para revisar el teléfono, las cuentas o los movimientos de la persona/i);
  assert.match(html, /tampoco autoriza a cambiar medicación, interpretar síntomas, decidir cuánto tiempo debe permanecer acompañada/i);
  assert.match(html, /el plan de seguridad pertenece a la persona y al equipo que la atiende/i);
});

test('privacy, local delivery and P0 telemetry exclusion stay explicit', () => {
  assert.match(html, /no copies detalles del intento, métodos, fotografías, informes completos, diagnósticos, contraseñas, ubicaciones en tiempo real/i);
  assert.match(html, /href=['"]\/assets\/home-fonts\.css['"]/i);
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);
  assert.doesNotMatch(html, /public-page-runtime\.js|visitor-analytics\.js|googletagmanager|\bgtag\b/i);
});

test('editorial and sitemap dates are synchronized', () => {
  assert.match(html, /"dateModified":"2026-10-29"/);
  assert.match(html, /Actualizado y auditado el 29 de octubre de 2026/i);
  assert.match(html, /Datos y servicios comprobados el 29 de octubre de 2026/i);
  assert.match(sitemap, /<loc>https:\/\/desgracias\.es\/alguien-cercano-ha-intentado-suicidarse\/<\/loc><lastmod>2026-10-29<\/lastmod>/);
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
  assert.match(html, /https:\/\/www\.sanidad\.gob\.es\/areas\/calidadAsistencial\/estrategias\/saludMental\/docs\/GPC_Conducta_Suicida\.pdf/);
  assert.match(html, /https:\/\/www\.who\.int\/teams\/mental-health-and-substance-use\/treatment-care\/mental-health-gap-action-programme\/evidence-centre\/self-harm-and-suicide\/safety-planning-interventions/);
  assert.match(html, /https:\/\/www\.who\.int\/teams\/mental-health-and-substance-use\/treatment-care\/mental-health-gap-action-programme\/evidence-centre\/self-harm-and-suicide\/usefulness-of-regular-contact/);
  assert.match(html, /https:\/\/www\.who\.int\/docs\/default-source\/mental-health\/suicide-prevention-first-responders\.pdf/);
  const externalAnchors = [...html.matchAll(/<a\s+[^>]*href=['\"]https?:\/\/[^'\"]+['\"][^>]*>/gi)].map(match => match[0]);
  assert.ok(externalAnchors.length >= 5, 'Expected a broad public evidence set');
  for (const anchor of externalAnchors) assert.match(anchor, /rel=['\"]noopener noreferrer['\"]/i, `Unsafe external link: ${anchor}`);
});
