function normalizeRoute(route) {
  const value = String(route ?? '').trim();
  if (!value.startsWith('/') || value.includes('?') || value.includes('#') || value.includes('..') || value.includes('%') || value.includes('\\') || value.length > 240) return null;
  if (value === '/') return '/';
  if (value.endsWith('.html')) return value;
  return value.endsWith('/') ? value : `${value}/`;
}

const VALID_STATUSES = new Set(['denied', 'candidate_review', 'hold', 'approved']);
const VALID_SAFETY_LEVELS = new Set(['P2', 'P3']);

export function validateMonetizationSurfaceRegistry(registry = {}) {
  const errors = [];
  if (registry.version !== 1) errors.push('registry_version_invalid');
  if (registry.default_status !== 'denied') errors.push('default_must_be_denied');
  if (registry.activation_enabled !== false) errors.push('activation_must_remain_disabled');
  if (!Array.isArray(registry.surfaces)) errors.push('surfaces_must_be_array');

  const seen = new Set();
  for (const [index, surface] of (Array.isArray(registry.surfaces) ? registry.surfaces : []).entries()) {
    const route = normalizeRoute(surface?.route);
    if (!route) {
      errors.push(`surface_${index}_route_invalid`);
      continue;
    }
    if (seen.has(route)) errors.push(`surface_${index}_route_duplicate`);
    seen.add(route);
    if (!VALID_STATUSES.has(surface.status)) errors.push(`surface_${index}_status_invalid`);
    if (!VALID_SAFETY_LEVELS.has(String(surface.safety_level ?? '').toUpperCase())) errors.push(`surface_${index}_safety_invalid`);
    if (surface.status !== 'approved' && surface.surface_approved !== false) errors.push(`surface_${index}_approval_must_be_false`);
    if (surface.status === 'approved' && surface.surface_approved !== true) errors.push(`surface_${index}_approved_requires_true`);
    if (!Array.isArray(surface.requirements_before_approval) || surface.requirements_before_approval.length === 0) errors.push(`surface_${index}_requirements_missing`);
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export function resolveMonetizationSurface(registry = {}, route) {
  const pathname = normalizeRoute(route);
  if (!pathname) return Object.freeze({ route:null, status:'denied', surface_approved:false, reason:'invalid_route' });
  const validation = validateMonetizationSurfaceRegistry(registry);
  if (!validation.valid) return Object.freeze({ route:pathname, status:'denied', surface_approved:false, reason:'registry_invalid' });

  const surface = registry.surfaces.find((entry) => normalizeRoute(entry.route) === pathname);
  if (!surface) return Object.freeze({ route:pathname, status:'denied', surface_approved:false, reason:'not_registered' });
  if (registry.activation_enabled !== false) return Object.freeze({ route:pathname, status:'denied', surface_approved:false, reason:'activation_flag_invalid' });

  return Object.freeze({
    route: pathname,
    safety_level: String(surface.safety_level).toUpperCase(),
    status: surface.status,
    surface_approved: surface.status === 'approved' && surface.surface_approved === true,
    commercial_models_under_review: Object.freeze([...(surface.commercial_models_under_review ?? [])]),
    requirements_before_approval: Object.freeze([...(surface.requirements_before_approval ?? [])]),
    reason: surface.reason ?? null
  });
}

export function registryCapabilities() {
  return Object.freeze({
    version: 1,
    default_denied: true,
    activation_side_effects: false,
    unregistered_routes_denied: true,
    p0_p1_not_permitted_in_registry: true
  });
}
