import crypto from 'node:crypto';
import { OPS_CAPABILITIES, authorizeOpsAction } from './ops-rbac.js';

const LEGACY_STAGING_ROLE = 'admin';
const LEGACY_STAGING_AAL = 'aal2';

function secureEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length === 0 || left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function stagingPrincipalFromBearer({ authorization, configuredToken } = {}) {
  const auth = String(authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!secureEqual(token, configuredToken)) return null;

  return Object.freeze({
    subject: 'legacy:staging-ops-token',
    role: LEGACY_STAGING_ROLE,
    aal: LEGACY_STAGING_AAL,
    auth_source: 'legacy_staging_token',
    transitional: true
  });
}

export function authorizeOpsPrincipal({ principal, capability, safetyLevel = 'NONE' } = {}) {
  if (!principal || typeof principal !== 'object') {
    return { allowed: false, reason: 'unauthenticated' };
  }

  return authorizeOpsAction({
    role: principal.role,
    aal: principal.aal,
    capability,
    safetyLevel
  });
}

export function capabilityForOpsRoute(method, route) {
  const key = `${String(method || '').toUpperCase()} ${String(route || '')}`;
  const capabilities = new Map([
    ['GET /ops/summary', OPS_CAPABILITIES.SUMMARY_READ],
    ['GET /ops/moderation/pending', OPS_CAPABILITIES.MODERATION_QUEUE_READ],
    ['GET /ops/moderation/:messageId/brief', OPS_CAPABILITIES.MODERATION_BRIEF_READ],
    ['POST /ops/moderation/:messageId/decision', OPS_CAPABILITIES.MODERATION_DECIDE_STANDARD],
    ['POST /ops/product/evaluate', OPS_CAPABILITIES.PRODUCT_EVALUATE]
  ]);
  return capabilities.get(key) || null;
}

export function buildOpsAuthorizationContext({ authorization, configuredToken, method, route, safetyLevel = 'NONE' } = {}) {
  const capability = capabilityForOpsRoute(method, route);
  if (!capability) return { allowed: false, reason: 'unmapped_route', principal: null, capability: null };

  const principal = stagingPrincipalFromBearer({ authorization, configuredToken });
  if (!principal) return { allowed: false, reason: 'unauthenticated', principal: null, capability };

  const decision = authorizeOpsPrincipal({ principal, capability, safetyLevel });
  return { ...decision, principal, capability };
}
