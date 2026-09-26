import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  validateMonetizationSurfaceRegistry,
  resolveMonetizationSurface,
  registryCapabilities
} from '../scripts/lib/monetization-surface-registry.mjs';
import {
  parseCriticalSafetyRoutes,
  evaluateMonetizationEligibility
} from '../scripts/lib/monetization-eligibility.mjs';

const registry = JSON.parse(await readFile(new URL('../data/monetization-surfaces.json', import.meta.url), 'utf8'));
const safetyInventory = await readFile(new URL('../SAFETY_ROUTE_INVENTORY.md', import.meta.url), 'utf8');
const criticalRoutes = parseCriticalSafetyRoutes(safetyInventory);

const allGreenExceptSurface = Object.freeze({
  commercial_phase_authorized:true,
  insurance_risk_review_complete:true,
  legal_privacy_review_complete:true,
  consent_mechanism_ready:true,
  surface_approved:false
});

test('registry is valid, deny-by-default and activation remains disabled', () => {
  const result = validateMonetizationSurfaceRegistry(registry);
  assert.equal(result.valid, true, result.errors.join(', '));
  assert.equal(registry.default_status, 'denied');
  assert.equal(registry.activation_enabled, false);
});

test('there are no approved monetization surfaces in v1', () => {
  assert.equal(registry.surfaces.filter((surface) => surface.status === 'approved' || surface.surface_approved === true).length, 0);
});

test('the first training surface is only a review candidate and cannot pass eligibility', () => {
  const route = '/trabajo/necesito-formacion-para-encontrar-trabajo/';
  const surface = resolveMonetizationSurface(registry, route);
  assert.equal(surface.status, 'candidate_review');
  assert.equal(surface.safety_level, 'P3');
  assert.equal(surface.surface_approved, false);

  const eligibility = evaluateMonetizationEligibility({
    route,
    safety_level:surface.safety_level,
    critical_routes:criticalRoutes,
    prerequisites:{...allGreenExceptSurface, surface_approved:surface.surface_approved}
  });
  assert.equal(eligibility.allowed, false);
  assert.equal(eligibility.reason, 'prerequisites_incomplete');
  assert.ok(eligibility.missing_prerequisites.includes('surface_approved'));
  assert.equal(eligibility.monetization_enabled, false);
});

test('unregistered routes are denied rather than inferred from category', () => {
  for (const route of ['/trabajo/', '/dinero/', '/familia/', '/']) {
    const surface = resolveMonetizationSurface(registry, route);
    assert.equal(surface.status, 'denied', route);
    assert.equal(surface.surface_approved, false, route);
    assert.equal(surface.reason, 'not_registered', route);
  }
});

test('critical Safety routes are never allowed into the commercial candidate registry', () => {
  const registered = new Set(registry.surfaces.map((surface) => surface.route));
  assert.ok(criticalRoutes.length > 0);
  for (const route of criticalRoutes) assert.equal(registered.has(route), false, route);
});

test('registry validator rejects P0/P1, implicit approvals and enabled activation', () => {
  const invalid = {
    version:1,
    default_status:'denied',
    activation_enabled:true,
    surfaces:[{
      route:'/unsafe/', safety_level:'P1', status:'candidate_review', surface_approved:true,
      requirements_before_approval:['surface_approved']
    }]
  };
  const validation = validateMonetizationSurfaceRegistry(invalid);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes('activation_must_remain_disabled'));
  assert.ok(validation.errors.includes('surface_0_safety_invalid'));
  assert.ok(validation.errors.includes('surface_0_approval_must_be_false'));
});

test('invalid route tricks fail closed', () => {
  for (const route of ['/trabajo/?x=1','/trabajo/#x','/%2e%2e/trabajo/','/trabajo\\otro/']) {
    const surface = resolveMonetizationSurface(registry, route);
    assert.equal(surface.status, 'denied');
    assert.equal(surface.surface_approved, false);
    assert.equal(surface.reason, 'invalid_route');
  }
});

test('capabilities preserve zero-side-effect registry behavior', () => {
  const caps = registryCapabilities();
  assert.equal(caps.default_denied, true);
  assert.equal(caps.activation_side_effects, false);
  assert.equal(caps.unregistered_routes_denied, true);
  assert.equal(caps.p0_p1_not_permitted_in_registry, true);
});
