import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { URL_OPPORTUNITY_MAP, EXPECTED_PRODUCTION_URL_COUNT } from '../opportunity/url-map.mjs';

const path = '/mi-pareja-me-maltrata-y-no-se-que-hacer/';
const html = fs.readFileSync(new URL('../mi-pareja-me-maltrata-y-no-se-que-hacer/index.html', import.meta.url), 'utf8');
const urgentHtml = fs.readFileSync(new URL('../ayuda-urgente.html', import.meta.url), 'utf8');
const rupturasHtml = fs.readFileSync(new URL('../rupturas/index.html', import.meta.url), 'utf8');
const ctx = URL_OPPORTUNITY_MAP[path];

function occurrences(text, regex) {
  return [...text.matchAll(regex)].length;
}

test('URL56 remains a high-risk restricted intimate-partner-violence support route', () => {
  assert.ok(ctx, 'URL56 must remain mapped');
  assert.equal(ctx.domain, 'intimate_partner_violence_support');
  assert.equal(ctx.risk, 'high');
  assert.equal(ctx.commercialPolicy, 'restricted');
  assert.deepEqual(ctx.opportunities, [], 'Active-abuse route must not expose commercial opportunities');
  for (const flag of [
    'active_abuse',
    'privacy_first',
    'quick_exit',
    'official_resources_first',
    'emergency_escalation',
    '016_scope_accurate',
    'victim_services_no_report_required',
    'no_pressure_to_report',
    'no_mediation_active_abuse',
    'children_safety',
    'legal_boundary',
    'no_automatic_diagnosis',
    'no_commercial_crisis_cta',
    'safety_override'
  ]) assert.ok(ctx.defaultFlags.includes(flag), `Missing safety flag: ${flag}`);
  assert.equal(EXPECTED_PRODUCTION_URL_COUNT, 57);
});

test('emergency resources and 016 remain visible with accurate scope', () => {
  assert.ok(occurrences(html, /href=['\"]tel:112['\"]/g) >= 5, '112 must remain visible across emergency contexts');
  assert.ok(occurrences(html, /href=['\"]tel:016['\"]/g) >= 4, '016 must remain visible across support contexts');
  assert.match(html, /091/);
  assert.match(html, /062/);
  assert.match(html, /violencia contra las mujeres/i);
  assert.match(html, /Si no encajas en el ámbito del 016/i);
  assert.match(html, /hombre víctima de violencia en pareja/i);
});

test('privacy and quick-exit boundaries are explicit without false anonymity promises', () => {
  assert.ok(occurrences(html, /Salir rápido/g) >= 2, 'Quick exit should be visible near the top and sidebar');
  assert.match(html, /no borra automáticamente el historial/i);
  assert.match(html, /dispositivo que no controle/i);
  assert.match(html, /referrerpolicy="no-referrer"/i);
  assert.match(html, /No hagas cambios tecnológicos que puedan aumentar el riesgo/i);
});

test('support is available before a reporting decision and legal boundary remains clear', () => {
  assert.match(html, /No sé si quiero denunciar/i);
  assert.match(html, /no está condicionada a haber presentado previamente una denuncia/i);
  assert.match(html, /Pedir información no te obliga/i);
  assert.match(html, /no puede decirte si debes denunciar/i);
  assert.match(html, /qué delito concreto/i);
});

test('active abuse never routes to mediation as the first response', () => {
  assert.match(html, /¿Terapia de pareja o mediación\?/i);
  assert.match(html, /la prioridad no es negociar mejor la relación/i);
  assert.match(html, /Primero deben abordarse seguridad, protección y atención especializada/i);
  assert.match(html, /no recomienda mediación en violencia activa/i);
});

test('children and vicarious violence remain covered without using minors as intermediaries', () => {
  assert.match(html, /Si hay hijos o hijas/i);
  assert.match(html, /violencia vicaria/i);
  assert.match(html, /menores víctimas directas/i);
  assert.match(html, /Evita pedir a los niños que hagan de mensajeros, espías o mediadores/i);
});

test('page covers broader victim support beyond the legal 016 frame', () => {
  assert.match(html, /persona LGTBIQ\+/i);
  assert.match(html, /relaciones del mismo sexo/i);
  assert.match(html, /Oficinas de Asistencia a las Víctimas del Delito/i);
  assert.match(html, /servicios públicos y gratuitos/i);
});

test('official Spanish evidence set remains primary and all external links are safe', () => {
  assert.match(html, /violenciagenero\.igualdad\.gob\.es\/informacion-3\/quehacer/);
  assert.match(html, /violenciagenero\.igualdad\.gob\.es\/informacion-3\/autoproteccion/);
  assert.match(html, /violenciagenero\.igualdad\.gob\.es\/otrasformas\/violenciavicaria/);
  assert.match(html, /mjusticia\.gob\.es\/es\/ciudadania\/victimas\/oficinas-asistencia-victimas/);
  assert.match(html, /policia\.es/);
  const externalAnchors = [...html.matchAll(/<a\s+[^>]*href=['\"]https?:\/\/[^'\"]+['\"][^>]*>/gi)].map(match => match[0]);
  assert.ok(externalAnchors.length >= 10, 'Expected a broad official evidence and resource set');
  for (const anchor of externalAnchors) {
    assert.match(anchor, /rel=['\"]noopener noreferrer['\"]/i, `Unsafe external link: ${anchor}`);
  }
});

test('page remains substantial, non-commercial and non-diagnostic', () => {
  assert.ok(html.length > 20_000, `Guide unexpectedly short: ${html.length} chars`);
  assert.doesNotMatch(html, /class=['\"]cta['\"]/i);
  assert.doesNotMatch(html, /href=['\"]\/#inicio['\"]/i);
  assert.match(html, /no diagnostica una relación/i);
  assert.match(html, /no ofrece servicios comerciales alrededor de una situación de peligro/i);
  assert.match(html, /No necesitas reunir una lista completa de señales/i);
});

test('high-risk route is discoverable from urgent help and relationship hub', () => {
  assert.match(urgentHtml, /href=['\"]\/mi-pareja-me-maltrata-y-no-se-que-hacer\/['\"]/i);
  assert.match(rupturasHtml, /href=['\"]\/mi-pareja-me-maltrata-y-no-se-que-hacer\/['\"]/i);
  assert.match(rupturasHtml, /seguridad y ayuda especializada van antes que mediación/i);
});
