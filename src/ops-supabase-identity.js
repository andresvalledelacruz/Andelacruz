import { buildOpsAuthorizationContext, capabilityForOpsRoute, authorizeOpsPrincipal } from './ops-authz.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function opsIdentityConfiguration(env = process.env) {
  if (env.OPS_SUPABASE_AUTH_ENABLED !== 'true') return null;
  try {
    const url = new URL(env.OPS_SUPABASE_URL);
    const subjects = String(env.OPS_ADMIN_SUBJECTS || '').split(',').map(x => x.trim()).filter(Boolean);
    const key = String(env.OPS_SUPABASE_PUBLISHABLE_KEY || '');
    if (url.protocol !== 'https:' || !/^[a-z0-9]+\.supabase\.co$/.test(url.hostname) ||
        url.port || url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
        !key.startsWith('sb_publishable_') || key.length > 2048 || subjects.length === 0 ||
        subjects.length > 16 || !subjects.every(x => uuid.test(x))) return null;
    return Object.freeze({ origin: url.origin, publishableKey: key, adminSubjects: Object.freeze(subjects) });
  } catch { return null; }
}

// Parsing is only a preliminary rejection filter. Supabase Auth must validate
// this exact token before any claim is used to authorize a request.
function candidateClaims(token, origin, now) {
  try {
    if (token.length > 8192 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;
    const [head, body] = token.split('.');
    const header = JSON.parse(Buffer.from(head, 'base64url').toString('utf8'));
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!['HS256','RS256','ES256'].includes(header.alg) || claims.iss !== origin + '/auth/v1' ||
        claims.aud !== 'authenticated' || claims.role !== 'authenticated' || claims.aal !== 'aal2' ||
        !uuid.test(claims.sub || '') || !uuid.test(claims.session_id || '') ||
        !Number.isFinite(claims.exp) || claims.exp <= now / 1000 ||
        (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now / 1000))) return null;
    return claims;
  } catch { return null; }
}

export async function supabaseOpsPrincipal({ authorization, configuration, pool,
  fetchImpl = fetch, clock = Date.now } = {}) {
  const now = clock();
  if (!configuration || !pool) return null;
  const token = typeof authorization === 'string' && authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const claims = candidateClaims(token, configuration.origin, now);
  if (!claims || !configuration.adminSubjects.includes(claims.sub)) return null;
  try {
    const response = await fetchImpl(configuration.origin + '/auth/v1/user', {
      headers: { apikey: configuration.publishableKey, Authorization: 'Bearer ' + token },
      redirect: 'error', signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return null;
    const user = await response.json();
    if (user.id !== claims.sub || user.is_anonymous !== false) return null;
    // Never trust browser metadata for roles, MFA or revocation. Require the
    // same live session and its still-verified factor on every request.
    const result = await pool.query({ text: `select exists (
      select 1 from auth.sessions s
      join auth.users u on u.id = s.user_id
      join auth.mfa_factors f on f.id = s.factor_id and f.user_id = s.user_id
      where s.id = $1::uuid and s.user_id = $2::uuid and s.aal = 'aal2'
        and f.status = 'verified' and u.is_anonymous = false and u.deleted_at is null
        and (u.banned_until is null or u.banned_until <= $3::timestamptz)
        and (s.not_after is null or s.not_after > $3::timestamptz)
    ) as active`, values: [claims.session_id, claims.sub, new Date(now).toISOString()], query_timeout: 5000 });
    if (result.rows[0]?.active !== true || claims.exp <= clock() / 1000) return null;
    return Object.freeze({ subject: user.id, role: 'admin', aal: 'aal2',
      auth_source: 'supabase_auth_live_session', transitional: false });
  } catch { return null; }
}

export async function resolveOpsRequestAuthorization(options = {}) {
  const legacy = buildOpsAuthorizationContext(options);
  if (legacy.reason === 'unmapped_route') return legacy;
  if (options.environment !== 'staging') return { allowed: false, reason: 'unauthenticated', principal: null, capability: legacy.capability };
  if (legacy.principal) return legacy;
  const principal = await supabaseOpsPrincipal(options);
  const capability = capabilityForOpsRoute(options.method, options.route);
  return { ...authorizeOpsPrincipal({ principal, capability, safetyLevel: options.safetyLevel }), principal, capability };
}
