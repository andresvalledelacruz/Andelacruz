import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { URL_OPPORTUNITY_MAP, EXPECTED_PRODUCTION_URL_COUNT } from '../opportunity/url-map.mjs';

const path = '/familia/mi-hijo-sufre-acoso-escolar-y-no-se-que-hacer/';
const html = fs.readFileSync(new URL('../familia/mi-hijo-sufre-acoso-escolar-y-no-se-que-hacer/index.html', import.meta.url), 'utf8');
const familyHtml = fs.readFileSync(new URL('../familia/index.html', import.meta.url), 'utf8');
const urgentHtml = fs.readFileSync(new URL('../ayuda-urgente.html', import.meta.url), 'utf8');
const ctx = URL_OPPORTUNITY_MAP[path];

function occurrences(text, regex) {
  return [...text.matchAll(regex)].length;
}

test('URL57 remains a high-risk restricted child-school-bullying route', () => {
  assert.ok(ctx, 'URL57 must remain mapped');
  assert.equal(ctx.domain, 'child_school_bullying_support');
  assert.equal(ctx.risk, 'high');
  assert.equal(ctx.commercialPolicy, 'restricted');
  assert.deepEqual(ctx.opportunities, [], 'Child-safety route must not expose commercial opportunities');
  for (const flag of [
    'child_safety',
    'school_bullying',
    'cyberbullying',
    'official_resources_first',
    'school_protocol_first',
    'wellbeing_coordinator',
    'no_automatic_diagnosis',
    'no_forced_confrontation',
    'preserve_digital_evidence',
    'no_secrecy_when_child_safety_at_risk',
    'emergency_escalation',
    'suicide_risk_bridge',
    'no_commercial_crisis_cta',
    'safety_override'
  ]) assert.ok(ctx.defaultFlags.includes(flag), `Missing safety flag: ${flag}`);
  assert.equal(EXPECTED_PRODUCTION_URL_COUNT, 59);
});

test('official school-bullying and emergency help remain highly visible', () => {
  assert.ok(occurrences(html, /href=['\"]tel:900018018['\"]/g) >= 4, '900 018 018 should remain visible in multiple contexts');
  assert.ok(occurrences(html, /href=['\"]tel:112['\"]/g) >= 3, '112 should remain visible for immediate danger');
  assert.match(html, /24 horas, todos los días del año/i);
  assert.match(html, /menores, familias, profesionales/i);
  assert.match(html, /Ministerio de Educación/i);
});

test('cyberbullying route preserves 017 scope and schedule', () => {
  assert.ok(occurrences(html, /href=['\"]tel:017['\"]/g) >= 3, '017 should remain visible across cyberbullying contexts');
  assert.match(html, /8:00 a 23:00/i);
  assert.match(html, /gratuito y confidencial/i);
  assert.match(html, /no reenvíes imágenes humillantes o íntimas/i);
  assert.match(html, /capturas, enlaces, nombres de usuario y fechas/i);
});

test('page does not diagnose bullying from a checklist', () => {
  assert.match(html, /Ninguna señal aislada diagnostica acoso escolar/i);
  assert.match(html, /diferencia.*acoso escolar.*conflicto ordinario/is);
  assert.match(html, /Desgracias\.es no decide desde Internet si existe bullying/i);
  assert.match(html, /no diagnostica acoso escolar mediante una lista de señales/i);
});

test('school protocol and wellbeing coordinator remain central', () => {
  assert.match(html, /todos los centros educativos donde estudien menores tengan un coordinador o coordinadora de bienestar y protección/i);
  assert.match(html, /qué protocolo corresponde/i);
  assert.match(html, /quién será su adulto de referencia/i);
  assert.match(html, /Protocolos por comunidad autónoma/i);
});

test('child voice is respected without unsafe secrecy promises', () => {
  assert.match(html, /No voy a contárselo a todo el mundo/i);
  assert.match(html, /no prometas secreto absoluto si su seguridad está en juego/i);
  assert.match(html, /dale participación/i);
  assert.match(html, /los adultos asumen la responsabilidad/i);
});

test('page rejects forced evidence gathering and impulsive confrontation', () => {
  assert.match(html, /No hagas que el niño o adolescente vuelva deliberadamente a una situación peligrosa/i);
  assert.match(html, /Evita una confrontación improvisada/i);
  assert.match(html, /La protección del menor va antes que.*resolverlo entre padres/is);
  assert.match(html, /no recomienda que el menor se exponga para conseguir pruebas/i);
});

test('health impact and suicide-risk bridge remain explicit without causal oversimplification', () => {
  assert.match(html, /Cuando el acoso está afectando a su salud/i);
  assert.match(html, /pediatra, médico de familia o los servicios de salud mental infanto-juvenil/i);
  assert.match(html, /href=['\"]tel:024['\"]/i);
  assert.match(html, /no conviertas el acoso en una explicación automática de una crisis suicida/i);
  assert.match(html, /href=['\"]\/me-preocupa-que-alguien-pueda-suicidarse\/['\"]/i);
});

test('official Spanish evidence set remains primary and external links are safe', () => {
  assert.match(html, /educacionfpydeportes\.gob\.es\/mc\/sgctie\/acoso-escolar/);
  assert.match(html, /educacionfpydeportes\.gob\.es\/mc\/sgctie\/convivencia-escolar\/recursos-nuevo\/guias\/acoso/);
  assert.match(html, /boe\.es\/buscar\/act\.php\?id=BOE-A-2021-9347/);
  assert.match(html, /incibe\.es\/menores\/tematicas\/ciberacoso/);
  assert.match(html, /incibe\.es\/linea-de-ayuda-en-ciberseguridad/);
  const externalAnchors = [...html.matchAll(/<a\s+[^>]*href=['\"]https?:\/\/[^'\"]+['\"][^>]*>/gi)].map(match => match[0]);
  assert.ok(externalAnchors.length >= 10, 'Expected a broad official evidence/resource set');
  for (const anchor of externalAnchors) {
    assert.match(anchor, /rel=['\"]noopener noreferrer['\"]/i, `Unsafe external link: ${anchor}`);
  }
});

test('page remains substantial, non-commercial and discoverable from safety surfaces', () => {
  assert.ok(html.length > 18_000, `Guide unexpectedly short: ${html.length} chars`);
  assert.doesNotMatch(html, /class=['\"]cta['\"]/i);
  assert.doesNotMatch(html, /href=['\"]\/#inicio['\"]/i);
  assert.match(html, /no ofrece servicios comerciales alrededor de una situación de violencia infantil/i);
  assert.match(familyHtml, /href=['\"]\/familia\/mi-hijo-sufre-acoso-escolar-y-no-se-que-hacer\/['\"]/i);
  assert.match(urgentHtml, /href=['\"]\/familia\/mi-hijo-sufre-acoso-escolar-y-no-se-que-hacer\/['\"]/i);
  assert.match(urgentHtml, /href=['\"]tel:900018018['\"]/i);
});
