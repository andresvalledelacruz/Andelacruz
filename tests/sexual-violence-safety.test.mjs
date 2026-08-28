import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { URL_OPPORTUNITY_MAP, EXPECTED_PRODUCTION_URL_COUNT } from '../opportunity/url-map.mjs';

const path = '/he-sufrido-una-agresion-sexual-y-no-se-que-hacer/';
const html = fs.readFileSync(new URL('../he-sufrido-una-agresion-sexual-y-no-se-que-hacer/index.html', import.meta.url), 'utf8');
const urgentHtml = fs.readFileSync(new URL('../ayuda-urgente.html', import.meta.url), 'utf8');
const ctx = URL_OPPORTUNITY_MAP[path];

function occurrences(text, regex) {
  return [...text.matchAll(regex)].length;
}

test('URL58 remains a high-risk restricted sexual-violence support route', () => {
  assert.ok(ctx, 'URL58 must remain mapped');
  assert.equal(ctx.domain, 'sexual_violence_support');
  assert.equal(ctx.risk, 'high');
  assert.equal(ctx.commercialPolicy, 'restricted');
  assert.deepEqual(ctx.opportunities, [], 'Sexual-violence route must not expose commercial opportunities');
  for (const flag of [
    'sexual_violence_support',
    'trauma_informed',
    'healthcare_independent_of_report',
    'preserve_options',
    'no_pressure_to_report',
    'crisis_centres_24h',
    '016_scope_accurate',
    'victim_offices_any_victim',
    'minors_safeguarding',
    'suspected_drug_facilitated_assault_medical',
    'no_forensic_guarantees',
    'privacy_first',
    'quick_exit',
    'no_automatic_diagnosis',
    'official_resources_first',
    'emergency_escalation',
    'suicide_risk_bridge',
    'no_commercial_crisis_cta',
    'safety_override'
  ]) assert.ok(ctx.defaultFlags.includes(flag), `Missing safety flag: ${flag}`);
  assert.equal(EXPECTED_PRODUCTION_URL_COUNT, 58);
});

test('emergency and healthcare-first guidance remains explicit', () => {
  assert.ok(occurrences(html, /href=['\"]tel:112['\"]/g) >= 5, '112 must remain visible in immediate-danger contexts');
  assert.match(html, /atención sanitaria no debe depender de que hayas decidido denunciar/i);
  assert.match(html, /Puedes acudir a un servicio sanitario aunque todavía no hayas decidido denunciar/i);
  assert.match(html, /actuaciones sanitarias.*independientemente.*denuncia/is);
});

test('reporting remains a choice while public victim support is available beforehand', () => {
  assert.match(html, /No sé si quiero denunciar/i);
  assert.match(html, /no está condicionada a presentar previamente una denuncia/i);
  assert.match(html, /Pedir esa información no te obliga/i);
  assert.match(html, /no puede decirte si debes denunciar/i);
  assert.match(html, /Oficinas de Asistencia a las Víctimas del Delito/i);
});

test('recent violence preserves options without forensic guarantees or universal deadlines', () => {
  assert.match(html, /evita basar tus decisiones en plazos genéricos de Internet/i);
  assert.match(html, /no concluyas que ya no sirve de nada pedir ayuda/i);
  assert.match(html, /no garantiza resultados forenses/i);
  assert.match(html, /valoración corresponde al equipo sanitario y forense/i);
});

test('016 and legal scope remain accurate for women and adult men are not falsely included', () => {
  assert.ok(occurrences(html, /href=['\"]tel:016['\"]/g) >= 3, '016 should remain visible for violence against women');
  assert.match(html, /todas las formas de violencia contra las mujeres/i);
  assert.match(html, /No presentamos el 016 como un servicio universal para hombres adultos/i);
  assert.match(html, /Si eres un hombre adulto/i);
  assert.match(html, /mujeres, niñas y niños/i);
});

test('24-hour crisis centres and long-term support remain covered within legal boundaries', () => {
  assert.match(html, /centros de crisis 24 horas/i);
  assert.match(html, /atención psicológica, jurídica y social/i);
  assert.match(html, /59 centros de crisis/i);
  assert.match(html, /violencia sexual.*pasada o reciente/is);
  assert.match(html, /servicios de recuperación integral/i);
});

test('minors are protected from repeated interviewing and confrontation', () => {
  assert.match(html, /Si la víctima es una niña, niño o adolescente/i);
  assert.match(html, /No interrogues repetidamente al menor/i);
  assert.match(html, /redu[c|z]ir la repetición innecesaria del relato/i);
  assert.match(html, /no hagas una confrontación que pueda aumentar el riesgo/i);
  assert.match(html, /prevención de victimización secundaria/i);
});

test('memory gaps and suspected substances route to medical assessment without unsupported conclusions', () => {
  assert.match(html, /Tengo lagunas y no sé exactamente qué ocurrió/i);
  assert.match(html, /no necesitas saber qué sustancia fue para pedir atención/i);
  assert.match(html, /No compres pruebas caseras/i);
  assert.match(html, /no puede concluir qué ocurrió/i);
  assert.match(html, /no interpreta pruebas toxicológicas/i);
});

test('privacy, digital harm and suicide bridge remain safety-led', () => {
  assert.ok(occurrences(html, /Salir rápido/g) >= 2, 'Quick exit should stay visible');
  assert.match(html, /no borra automáticamente el historial/i);
  assert.match(html, /no redistribuyas el material/i);
  assert.match(html, /href=['\"]tel:017['\"]/i);
  assert.match(html, /href=['\"]tel:024['\"]/i);
  assert.match(html, /href=['\"]\/me-preocupa-que-alguien-pueda-suicidarse\/['\"]/i);
});

test('page remains substantial, non-commercial, official-first and discoverable from urgent help', () => {
  assert.ok(html.length > 22_000, `Guide unexpectedly short: ${html.length} chars`);
  assert.doesNotMatch(html, /class=['\"]cta['\"]/i);
  assert.doesNotMatch(html, /href=['\"]\/#inicio['\"]/i);
  assert.match(html, /no ofrece servicios comerciales alrededor de una situación de violencia sexual/i);
  assert.match(urgentHtml, /href=['\"]\/he-sufrido-una-agresion-sexual-y-no-se-que-hacer\/['\"]/i);
  const externalAnchors = [...html.matchAll(/<a\s+[^>]*href=['\"]https?:\/\/[^'\"]+['\"][^>]*>/gi)].map(match => match[0]);
  assert.ok(externalAnchors.length >= 12, 'Expected a broad official evidence/resource set');
  for (const anchor of externalAnchors) {
    assert.match(anchor, /rel=['\"]noopener noreferrer['\"]/i, `Unsafe external link: ${anchor}`);
  }
});
