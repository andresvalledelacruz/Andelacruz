import test from 'node:test';
import assert from 'node:assert/strict';
import { OPS_CAPABILITIES } from '../src/ops-rbac.js';
import {
  authorizeOpsPrincipal,
  buildOpsAuthorizationContext,
  capabilityForOpsRoute,
  stagingPrincipalFromBearer
} from '../src/ops-authz.js';

test('legacy staging bearer becomes an explicit transitional principal', () => {
  const principal = stagingPrincipalFromBearer({ authorization: 'Bearer secret', configuredToken: 'secret' });
  assert.equal(principal.role, 'admin');
  assert.equal(principal.aal, 'aal2');
  assert.equal(principal.transitional, true);
  assert.equal(principal.auth_source, 'legacy_staging_token');
});

test('invalid or absent bearer fails closed', () => {
  assert.equal(stagingPrincipalFromBearer({ authorization: 'Bearer wrong', configuredToken: 'secret' }), null);
  assert.equal(stagingPrincipalFromBearer({ authorization: '', configuredToken: 'secret' }), null);
  assert.equal(stagingPrincipalFromBearer({ authorization: 'Bearer secret', configuredToken: '' }), null);
});

test('every current privileged ops API route has an explicit capability', () => {
  assert.equal(capabilityForOpsRoute('GET', '/ops/summary'), OPS_CAPABILITIES.SUMMARY_READ);
  assert.equal(capabilityForOpsRoute('GET', '/ops/moderation/pending'), OPS_CAPABILITIES.MODERATION_QUEUE_READ);
  assert.equal(capabilityForOpsRoute('GET', '/ops/moderation/:messageId/brief'), OPS_CAPABILITIES.MODERATION_BRIEF_READ);
  assert.equal(capabilityForOpsRoute('POST', '/ops/moderation/:messageId/decision'), OPS_CAPABILITIES.MODERATION_DECIDE_STANDARD);
  assert.equal(capabilityForOpsRoute('POST', '/ops/product/evaluate'), OPS_CAPABILITIES.PRODUCT_EVALUATE);
  assert.equal(capabilityForOpsRoute('DELETE', '/ops/unknown'), null);
});

test('unmapped routes and unauthenticated requests are denied', () => {
  assert.equal(buildOpsAuthorizationContext({ method: 'DELETE', route: '/ops/unknown' }).reason, 'unmapped_route');
  const denied = buildOpsAuthorizationContext({
    authorization: 'Bearer wrong', configuredToken: 'secret', method: 'GET', route: '/ops/summary'
  });
  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, 'unauthenticated');
});

test('identity principals still obey RBAC and AAL2 independently of legacy auth', () => {
  assert.deepEqual(authorizeOpsPrincipal({
    principal: { role: 'moderator', aal: 'aal1' },
    capability: OPS_CAPABILITIES.MODERATION_DECIDE_STANDARD
  }), { allowed: false, reason: 'aal2_required' });

  assert.deepEqual(authorizeOpsPrincipal({
    principal: { role: 'moderator', aal: 'aal2' },
    capability: OPS_CAPABILITIES.MODERATION_DECIDE_STANDARD,
    safetyLevel: 'P1'
  }), { allowed: false, reason: 'safety_role_required' });
});

test('legacy staging bridge remains compatible while being explicit and auditable', () => {
  const result = buildOpsAuthorizationContext({
    authorization: 'Bearer secret', configuredToken: 'secret', method: 'POST', route: '/ops/moderation/:messageId/decision'
  });
  assert.equal(result.allowed, true);
  assert.equal(result.principal.subject, 'legacy:staging-ops-token');
  assert.equal(result.capability, OPS_CAPABILITIES.MODERATION_DECIDE_STANDARD);
});
