const REQUIRED_PREREQUISITES = Object.freeze([
  'commercial_phase_authorized',
  'insurance_risk_review_complete',
  'legal_privacy_review_complete',
  'consent_mechanism_ready',
  'surface_approved'
]);

function normalizeRoute(route) {
  const value = String(route ?? '').trim();
  if (!value.startsWith('/') || value.includes('?') || value.includes('#') || value.includes('..') || value.includes('%') || value.includes('\\') || value.length > 240) return null;
  if (value === '/') return '/';
  if (value.endsWith('.html')) return value;
  return value.endsWith('/') ? value : value + '/';
}

export function parseCriticalSafetyRoutes(markdown = '') {
  const section = String(markdown).split('## P0/P1 — monetización denegada por construcción')[1]?.split('\n## ')[0] ?? '';
  const routes = [];
  for (const line of section.split('\n')) {
    const match = line.match(/^\|\s*`(\/[^\`]+)`\s*\|/);
    if (match) routes.push(normalizeRoute(match[1]));
  }
  return Object.freeze([...new Set(routes.filter(Boolean))]);
}

export function evaluateMonetizationEligibility({
  route,
  safety_level = 'UNKNOWN',
  critical_routes = null,
  prerequisites = {}
} = {}) {
  const pathname = normalizeRoute(route);
  const safetyLevel = String(safety_level ?? 'UNKNOWN').toUpperCase();

  if (!pathname) {
    return Object.freeze({ allowed:false, reason:'invalid_route', route:null, monetization_enabled:false });
  }

  // P0/P1 and unknown classifications fail closed even if the inventory cannot be loaded.
  if (safetyLevel === 'P0' || safetyLevel === 'P1') {
    return Object.freeze({ allowed:false, reason:'safety_surface', route:pathname, monetization_enabled:false });
  }
  if (!['P2','P3'].includes(safetyLevel)) {
    return Object.freeze({ allowed:false, reason:'unknown_or_unreviewed_safety', route:pathname, monetization_enabled:false });
  }

  // A P2/P3 route can never become eligible if the canonical Safety deny-list is absent,
  // malformed or empty. Missing policy data is a blocker, not permission to monetize.
  if (!Array.isArray(critical_routes)) {
    return Object.freeze({ allowed:false, reason:'critical_inventory_unavailable', route:pathname, monetization_enabled:false });
  }
  const critical = new Set(critical_routes.map(normalizeRoute).filter(Boolean));
  if (critical.size === 0) {
    return Object.freeze({ allowed:false, reason:'critical_inventory_unavailable', route:pathname, monetization_enabled:false });
  }
  if (critical.has(pathname)) {
    return Object.freeze({ allowed:false, reason:'safety_surface', route:pathname, monetization_enabled:false });
  }

  const missing = REQUIRED_PREREQUISITES.filter((key) => prerequisites[key] !== true);
  if (missing.length > 0) {
    return Object.freeze({
      allowed:false,
      reason:'prerequisites_incomplete',
      route:pathname,
      missing_prerequisites:Object.freeze(missing),
      monetization_enabled:false
    });
  }

  return Object.freeze({
    allowed:true,
    reason:'explicitly_eligible',
    route:pathname,
    missing_prerequisites:Object.freeze([]),
    monetization_enabled:false,
    activation_requires_separate_integration:true
  });
}

export function monetizationEligibilityCapabilities() {
  return Object.freeze({
    version:2,
    deny_by_default:true,
    p0_p1_always_denied:true,
    requires_critical_inventory:true,
    requires_explicit_surface_approval:true,
    activation_side_effects:false,
    required_prerequisites:REQUIRED_PREREQUISITES
  });
}
