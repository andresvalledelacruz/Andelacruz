import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  sanitizeCommercialEvent,
  commercialEventCapabilities
} from '../scripts/lib/commercial-event-schema.mjs';
import { parseCriticalSafetyRoutes } from '../scripts/lib/monetization-eligibility.mjs';

const safetyInventory = await readFile(new URL('../SAFETY_ROUTE_INVENTORY.md', import.meta.url), 'utf8');
const criticalRoutes = parseCriticalSafetyRoutes(safetyInventory);
const base = Object.freeze({
  route:'/trabajo/necesito-formacion-para-encontrar-trabajo/',
  surface_id:'training-gap-v1',
  partner_id:'training-provider',
  commercial_model:'education_partner',
  country_code:'ES'
});

test('client may measure only offer view/click with bounded non-sensitive fields', () => {
  for (const event of ['commercial_offer_view','commercial_offer_click']) {
    const result = sanitizeCommercialEvent({...base,event},{source:'client',critical_routes:criticalRoutes});
    assert.equal(result.valid, true, result.errors.join(', '));
    assert.equal(result.payload.event, event);
    assert.equal(Object.hasOwn(result.payload, 'value_minor_units'), false);
  }
});

test('client cannot claim lead, sale or revenue', () => {
  for (const event of ['commercial_lead_confirmed','commercial_sale_confirmed','commercial_revenue_booked']) {
    const result = sanitizeCommercialEvent({...base,event,value_minor_units:5000,currency:'EUR'},{source:'client',critical_routes:criticalRoutes});
    assert.equal(result.valid, false);
    assert.ok(result.errors.includes('event_not_allowed_for_source') || result.errors.includes('server_event_from_client_forbidden'));
  }
});

test('server may record confirmed commercial outcomes with bounded amount/currency', () => {
  const result = sanitizeCommercialEvent({...base,event:'commercial_revenue_booked',value_minor_units:1250,currency:'eur'},{source:'server',critical_routes:criticalRoutes});
  assert.equal(result.valid, true, result.errors.join(', '));
  assert.equal(result.payload.value_minor_units, 1250);
  assert.equal(result.payload.currency, 'EUR');
});

test('critical routes are rejected even for server-side commercial events', () => {
  assert.ok(criticalRoutes.length > 0);
  for (const route of criticalRoutes) {
    const result = sanitizeCommercialEvent({...base,route,event:'commercial_offer_view'},{source:'server',critical_routes:criticalRoutes});
    assert.equal(result.valid, false, route);
    assert.ok(result.errors.includes('critical_route_forbidden'), route);
  }
});

test('search text, stories, identity and sensitive attributes are prohibited by field name at any nesting depth', () => {
  const forbidden = [
    {query:'necesito ayuda'},
    {story:'texto personal'},
    {email:'persona@example.com'},
    {phone:'600000000'},
    {health_status:'x'},
    {meta:{free_text:'algo'}},
    {meta:{fingerprint:'abc'}},
    {session_id:'abc'}
  ];
  for (const extra of forbidden) {
    const result = sanitizeCommercialEvent({...base,event:'commercial_offer_click',...extra},{source:'client',critical_routes:criticalRoutes});
    assert.equal(result.valid, false, JSON.stringify(extra));
    assert.ok(result.errors.some((error) => error.startsWith('prohibited_field:')), JSON.stringify(extra));
  }
});

test('client cannot submit revenue fields even on a click event', () => {
  const result = sanitizeCommercialEvent({...base,event:'commercial_offer_click',value_minor_units:1,currency:'EUR'},{source:'client',critical_routes:criticalRoutes});
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('client_revenue_fields_forbidden'));
});

test('bad route, model, country, currency and amount fail closed', () => {
  assert.equal(sanitizeCommercialEvent({...base,event:'commercial_offer_view',route:'/trabajo/?q=x'},{source:'client',critical_routes:criticalRoutes}).valid, false);
  assert.equal(sanitizeCommercialEvent({...base,event:'commercial_offer_view',commercial_model:'anything'},{source:'client',critical_routes:criticalRoutes}).valid, false);
  assert.equal(sanitizeCommercialEvent({...base,event:'commercial_offer_view',country_code:'ESP'},{source:'client',critical_routes:criticalRoutes}).valid, false);
  assert.equal(sanitizeCommercialEvent({...base,event:'commercial_revenue_booked',value_minor_units:-5,currency:'EU'},{source:'server',critical_routes:criticalRoutes}).valid, false);
});

test('capabilities explicitly prohibit sensitive commercial profiling', () => {
  const caps = commercialEventCapabilities();
  assert.equal(caps.free_text_allowed, false);
  assert.equal(caps.sensitive_query_allowed, false);
  assert.equal(caps.story_content_allowed, false);
  assert.equal(caps.client_revenue_allowed, false);
  assert.equal(caps.critical_routes_allowed, false);
});
