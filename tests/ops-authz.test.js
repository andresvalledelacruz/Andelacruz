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
  const principal = stagingPrincipalFromBearer({ authorization: 'Bearer secret', configuredToken: 'secret', environment: 'staging' });
  assert.equal(principal.role, 'admin');
  assert.equal(principal.aal, 'aal2');
  assert.equal(principal.transitional, true);
  assert.equal(principal.auth_source, 'legacy_staging_token');
});

test('legacy staging bearer is rejected outside staging even with a valid token', () => {
  for (const environment of ['production', 'preview', 'development', 'test']) {
    assert.equal(stagingPrincipalFromBearer({
      authorization: 'Bearer secret',
      configuredToken: 'secret',
      environment
    }), null);

    const denied = buildOpsAuthorizationContext({
      authorization: 'Bearer secret',
      configuredToken: 'secret',
      environment,
      method: 'GET',
      route: '/ops/summary'
    });
    assert.equal(denied.allowed, false);
    assert.equal(denied.reason, 'unauthenticated');
    assert.equal(denied.principal, null);
  }
});

test('legacy staging bearer fails closed when environment is missing or blank', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  try {
    delete process.env.NODE_ENV;
    for (const environment of [undefined, null, '']) {
      assert.equal(stagingPrincipalFromBearer({
        authorization: 'Bearer secret',
        configuredToken: 'secret',
        environment
      }), null);

      const denied = buildOpsAuthorizationContext({
        authorization: 'Bearer secret',
        configuredToken: 'secret',
        environment,
        method: 'GET',
        route: '/ops/summary'
      });
      assert.equal(denied.allowed, false);
      assert.equal(denied.reason, 'unauthenticated');
      assert.equal(denied.principal, null);
    }
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});

test('invalid or absent bearer fails closed', () => {
  assert.equal(stagingPrincipalFromBearer({ authorization: 'Bearer wrong', configuredToken: 'secret', environment: 'staging' }), null);
  assert.equal(stagingPrincipalFromBearer({ authorization: '', configuredToken: 'secret', environment: 'staging' }), null);
  assert.equal(stagingPrincipalFromBearer({ authorization: 'Bearer secret', configuredToken: '', environment: 'staging' }), null);
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
    authorization: 'Bearer wrong', configuredToken: 'secret', environment: 'staging', method: 'GET', route: '/ops/summary'
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

test('legacy staging bridge remains compatible for non-sensitive ops', () => {
  const summary = buildOpsAuthorizationContext({
    authorization: 'Bearer secret', configuredToken: 'secret', environment: 'staging', method: 'GET', route: '/ops/summary'
  });
  assert.equal(summary.allowed, true);
  assert.equal(summary.principal.subject, 'legacy:staging-ops-token');

  const product = buildOpsAuthorizationContext({
    authorization: 'Bearer secret', configuredToken: 'secret', environment: 'staging', method: 'POST', route: '/ops/product/evaluate'
  });
  assert.equal(product.allowed, true);
  assert.equal(product.capability, OPS_CAPABILITIES.PRODUCT_EVALUATE);
});

test('legacy staging bridge cannot read moderation case data', () => {
  for (const route of ['/ops/moderation/pending', '/ops/moderation/:messageId/brief']) {
    const result = buildOpsAuthorizationContext({
      authorization: 'Bearer secret',
      configuredToken: 'secret',
      environment: 'staging',
      method: 'GET',
      route
    });
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'individual_identity_required_for_moderation_data');
    assert.equal(result.principal.transitional, true);
  }
});

test('legacy staging bridge remains compatible for non-safety decisions', () => {
  const result = buildOpsAuthorizationContext({
    authorization: 'Bearer secret', configuredToken: 'secret', environment: 'staging', method: 'POST', route: '/ops/moderation/:messageId/decision'
  });
  assert.equal(result.allowed, true);
  assert.equal(result.principal.subject, 'legacy:staging-ops-token');
  assert.equal(result.capability, OPS_CAPABILITIES.MODERATION_DECIDE_STANDARD);
});

test('legacy staging bridge cannot decide P0 or P1 cases', () => {
  for (const safetyLevel of ['P0', 'P1', 'p0', 'p1']) {
    const result = buildOpsAuthorizationContext({
      authorization: 'Bearer secret',
      configuredToken: 'secret',
      environment: 'staging',
      method: 'POST',
      route: '/ops/moderation/:messageId/decision',
      safetyLevel
    });
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'individual_identity_required_for_safety');
    assert.equal(result.principal.transitional, true);
  }
});

test('named safety reviewer with AAL2 can read moderation data and decide P0/P1', () => {
  for (const capability of [OPS_CAPABILITIES.MODERATION_QUEUE_READ, OPS_CAPABILITIES.MODERATION_BRIEF_READ]) {
    assert.deepEqual(authorizeOpsPrincipal({
      principal: { subject: 'user:reviewer', role: 'safety_reviewer', aal: 'aal2', transitional: false },
      capability
    }), { allowed: true, reason: 'authorized' });
  }

  assert.deepEqual(authorizeOpsPrincipal({
    principal: { subject: 'user:reviewer', role: 'safety_reviewer', aal: 'aal2', transitional: false },
    capability: OPS_CAPABILITIES.MODERATION_DECIDE_STANDARD,
    safetyLevel: 'P0'
  }), { allowed: true, reason: 'authorized' });
});
