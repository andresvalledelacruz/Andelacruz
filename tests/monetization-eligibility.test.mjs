import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  parseCriticalSafetyRoutes,
  evaluateMonetizationEligibility,
  monetizationEligibilityCapabilities
} from '../scripts/lib/monetization-eligibility.mjs';

const allGreen = Object.freeze({
  commercial_phase_authorized:true,
  insurance_risk_review_complete:true,
  legal_privacy_review_complete:true,
  consent_mechanism_ready:true,
  surface_approved:true
});

test('every route in the Safety inventory remains denied even if commercial prerequisites are green', async () => {
  const markdown = await readFile(new URL('../SAFETY_ROUTE_INVENTORY.md', import.meta.url), 'utf8');
  const critical = parseCriticalSafetyRoutes(markdown);
  assert.ok(critical.length > 0);
  for (const route of critical) {
    const result = evaluateMonetizationEligibility({
      route,
      safety_level:'P3',
      critical_routes:critical,
      prerequisites:allGreen
    });
    assert.equal(result.allowed, false, route);
    assert.equal(result.reason, 'safety_surface', route);
    assert.equal(result.monetization_enabled, false, route);
  }
});

test('P0 and P1 are denied even when a route is absent from the inventory', () => {
  for (const safety_level of ['P0','P1']) {
    const result = evaluateMonetizationEligibility({
      route:'/future-sensitive-route/',
      safety_level,
      critical_routes:[],
      prerequisites:allGreen
    });
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'safety_surface');
  }
});

test('unknown safety classification fails closed', () => {
  const result = evaluateMonetizationEligibility({
    route:'/familia/',
    safety_level:'UNKNOWN',
    critical_routes:[],
    prerequisites:allGreen
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'unknown_or_unreviewed_safety');
});

test('P2/P3 still fail closed until every prerequisite and surface approval is explicit', () => {
  const result = evaluateMonetizationEligibility({
    route:'/familia/',
    safety_level:'P3',
    critical_routes:[],
    prerequisites:{ commercial_phase_authorized:true }
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'prerequisites_incomplete');
  assert.ok(result.missing_prerequisites.includes('insurance_risk_review_complete'));
  assert.ok(result.missing_prerequisites.includes('surface_approved'));
});

test('eligibility never activates ads or other commercial side effects', () => {
  const result = evaluateMonetizationEligibility({
    route:'/familia/',
    safety_level:'P3',
    critical_routes:[],
    prerequisites:allGreen
  });
  assert.equal(result.allowed, true);
  assert.equal(result.reason, 'explicitly_eligible');
  assert.equal(result.monetization_enabled, false);
  assert.equal(result.activation_requires_separate_integration, true);
});

test('query strings, fragments and traversal-like routes are rejected', () => {
  for (const route of ['/familia/?x=1','/familia/#x','/../familia/']) {
    const result = evaluateMonetizationEligibility({route,safety_level:'P3',prerequisites:allGreen});
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'invalid_route');
  }
});

test('capabilities pin deny-by-default behavior', () => {
  const caps = monetizationEligibilityCapabilities();
  assert.equal(caps.version, 2);
  assert.equal(caps.deny_by_default, true);
  assert.equal(caps.p0_p1_always_denied, true);
  assert.equal(caps.requires_explicit_surface_approval, true);
  assert.equal(caps.activation_side_effects, false);
});
