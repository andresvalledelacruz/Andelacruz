import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OPS_CAPABILITIES,
  authorizeOpsAction,
  capabilitiesForRole,
  hasOpsCapability,
  normalizeOpsRole
} from '../src/ops-rbac.js';

test('roles normalize strictly and unknown roles fail closed', () => {
  assert.equal(normalizeOpsRole(' Moderator '), 'moderator');
  assert.equal(normalizeOpsRole('owner'), null);
  assert.equal(normalizeOpsRole(''), null);
});

test('analyst is read-only', () => {
  assert.equal(hasOpsCapability('analyst', OPS_CAPABILITIES.SUMMARY_READ), true);
  assert.equal(hasOpsCapability('analyst', OPS_CAPABILITIES.MODERATION_QUEUE_READ), true);
  assert.equal(hasOpsCapability('analyst', OPS_CAPABILITIES.MODERATION_DECIDE_STANDARD), false);
  assert.equal(hasOpsCapability('analyst', OPS_CAPABILITIES.ACCESS_MANAGE), false);
});

test('moderator can decide standard cases only with AAL2', () => {
  assert.deepEqual(
    authorizeOpsAction({
      role: 'moderator',
      capability: OPS_CAPABILITIES.MODERATION_DECIDE_STANDARD,
      aal: 'aal1',
      safetyLevel: 'NONE'
    }),
    { allowed: false, reason: 'aal2_required' }
  );

  assert.deepEqual(
    authorizeOpsAction({
      role: 'moderator',
      capability: OPS_CAPABILITIES.MODERATION_DECIDE_STANDARD,
      aal: 'aal2',
      safetyLevel: 'NONE'
    }),
    { allowed: true, reason: 'authorized' }
  );
});

test('P0/P1 moderation cannot be decided by ordinary moderator even with AAL2', () => {
  for (const safetyLevel of ['P0', 'P1']) {
    assert.deepEqual(
      authorizeOpsAction({
        role: 'moderator',
        capability: OPS_CAPABILITIES.MODERATION_DECIDE_STANDARD,
        aal: 'aal2',
        safetyLevel
      }),
      { allowed: false, reason: 'safety_role_required' }
    );
  }
});

test('safety reviewer can handle P0/P1 after AAL2', () => {
  assert.deepEqual(
    authorizeOpsAction({
      role: 'safety_reviewer',
      capability: OPS_CAPABILITIES.MODERATION_DECIDE_STANDARD,
      aal: 'aal2',
      safetyLevel: 'P0'
    }),
    { allowed: true, reason: 'authorized' }
  );

  assert.equal(
    hasOpsCapability('safety_reviewer', OPS_CAPABILITIES.MODERATION_DECIDE_SAFETY),
    true
  );
});

test('only admin can manage access and it requires AAL2', () => {
  assert.equal(hasOpsCapability('moderator', OPS_CAPABILITIES.ACCESS_MANAGE), false);
  assert.deepEqual(
    authorizeOpsAction({
      role: 'admin',
      capability: OPS_CAPABILITIES.ACCESS_MANAGE,
      aal: 'aal1'
    }),
    { allowed: false, reason: 'aal2_required' }
  );
  assert.deepEqual(
    authorizeOpsAction({
      role: 'admin',
      capability: OPS_CAPABILITIES.ACCESS_MANAGE,
      aal: 'aal2'
    }),
    { allowed: true, reason: 'authorized' }
  );
});

test('role capability output is deterministic and excludes privilege inflation', () => {
  const moderatorCapabilities = capabilitiesForRole('moderator');
  assert.deepEqual([...moderatorCapabilities].sort(), moderatorCapabilities);
  assert.equal(moderatorCapabilities.includes(OPS_CAPABILITIES.MODERATION_DECIDE_SAFETY), false);
  assert.equal(moderatorCapabilities.includes(OPS_CAPABILITIES.ACCESS_MANAGE), false);
});
