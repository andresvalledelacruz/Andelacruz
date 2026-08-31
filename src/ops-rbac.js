export const OPS_ROLES = Object.freeze([
  'analyst',
  'moderator',
  'safety_reviewer',
  'admin'
]);

export const OPS_CAPABILITIES = Object.freeze({
  SUMMARY_READ: 'ops.summary.read',
  MODERATION_QUEUE_READ: 'moderation.queue.read',
  MODERATION_BRIEF_READ: 'moderation.brief.read',
  MODERATION_DECIDE_STANDARD: 'moderation.decision.standard',
  MODERATION_DECIDE_SAFETY: 'moderation.decision.safety',
  PRODUCT_EVALUATE: 'product.evaluate',
  AUDIT_READ: 'audit.read',
  ACCESS_MANAGE: 'access.manage'
});

const ROLE_CAPABILITIES = Object.freeze({
  analyst: new Set([
    OPS_CAPABILITIES.SUMMARY_READ,
    OPS_CAPABILITIES.AUDIT_READ
  ]),
  moderator: new Set([
    OPS_CAPABILITIES.SUMMARY_READ,
    OPS_CAPABILITIES.MODERATION_DECIDE_STANDARD,
    OPS_CAPABILITIES.AUDIT_READ
  ]),
  safety_reviewer: new Set([
    OPS_CAPABILITIES.SUMMARY_READ,
    OPS_CAPABILITIES.MODERATION_QUEUE_READ,
    OPS_CAPABILITIES.MODERATION_BRIEF_READ,
    OPS_CAPABILITIES.MODERATION_DECIDE_STANDARD,
    OPS_CAPABILITIES.MODERATION_DECIDE_SAFETY,
    OPS_CAPABILITIES.AUDIT_READ
  ]),
  admin: new Set(Object.values(OPS_CAPABILITIES))
});

const AAL2_REQUIRED = new Set([
  OPS_CAPABILITIES.MODERATION_QUEUE_READ,
  OPS_CAPABILITIES.MODERATION_BRIEF_READ,
  OPS_CAPABILITIES.MODERATION_DECIDE_STANDARD,
  OPS_CAPABILITIES.MODERATION_DECIDE_SAFETY,
  OPS_CAPABILITIES.ACCESS_MANAGE
]);

const SAFETY_LEVELS = new Set(['P0', 'P1']);

export function normalizeOpsRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  return OPS_ROLES.includes(normalized) ? normalized : null;
}

export function capabilitiesForRole(role) {
  const normalized = normalizeOpsRole(role);
  if (!normalized) return [];
  return [...ROLE_CAPABILITIES[normalized]].sort();
}

export function hasOpsCapability(role, capability) {
  const normalized = normalizeOpsRole(role);
  if (!normalized || typeof capability !== 'string') return false;
  return ROLE_CAPABILITIES[normalized].has(capability);
}

export function capabilityRequiresAal2(capability) {
  return AAL2_REQUIRED.has(capability);
}

export function authorizeOpsAction({
  role,
  capability,
  aal = 'aal1',
  safetyLevel = 'NONE'
} = {}) {
  const normalizedRole = normalizeOpsRole(role);
  if (!normalizedRole) {
    return { allowed: false, reason: 'unknown_role' };
  }

  if (!hasOpsCapability(normalizedRole, capability)) {
    return { allowed: false, reason: 'missing_capability' };
  }

  if (capabilityRequiresAal2(capability) && String(aal).toLowerCase() !== 'aal2') {
    return { allowed: false, reason: 'aal2_required' };
  }

  if (
    capability === OPS_CAPABILITIES.MODERATION_DECIDE_STANDARD &&
    SAFETY_LEVELS.has(String(safetyLevel).toUpperCase()) &&
    !hasOpsCapability(normalizedRole, OPS_CAPABILITIES.MODERATION_DECIDE_SAFETY)
  ) {
    return { allowed: false, reason: 'safety_role_required' };
  }

  return { allowed: true, reason: 'authorized' };
}
