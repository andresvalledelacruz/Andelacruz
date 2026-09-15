export const PUBLIC_COMMERCIAL_OPPORTUNITIES = Object.freeze([
  'JOB_SEARCH','CV_SERVICE','INTERVIEW_COACHING','TRAINING',
  'SOCIAL_ACTIVITIES','MATCHMAKING','ENERGY_SWITCH','TELECOM_SWITCH','HOME_SERVICES'
]);

export const NEVER_MONETIZE_FLAGS = Object.freeze([
  'critical_safety','urgent_protection','urgent_health','minor_protection',
  'suicide_prevention','active_abuse','sexual_violence_support','child_safety','safety_override'
]);

export const NEVER_MONETIZE_DOMAINS = Object.freeze([
  'suicide_prevention_support','suicide_attempt_aftercare_family','intimate_partner_violence_support',
  'sexual_violence_support','child_school_bullying_support','family_addiction_support'
]);

export const AD_SAFE_PATHS = Object.freeze([
  '/soluciones/','/colaborar/','/media-kit.html'
]);

export const AD_BLOCKED_PREFIXES = Object.freeze([
  '/buscar/','/duelo/','/familia/','/soledad/','/rupturas/','/ayuda-urgente.html',
  '/me-preocupa-que-alguien-pueda-suicidarse/','/alguien-cercano-ha-intentado-suicidarse/',
  '/mi-pareja-me-maltrata-y-no-se-que-hacer/','/he-sufrido-una-agresion-sexual-y-no-se-que-hacer/'
]);

function hasBlockedFlag(flags = []) {
  const set = new Set(flags);
  return NEVER_MONETIZE_FLAGS.some(flag => set.has(flag));
}

export function evaluateRevenueSurface(input = {}) {
  const risk = String(input.risk || 'unknown').toLowerCase();
  const policy = String(input.commercialPolicy || 'off').toLowerCase();
  const domain = String(input.domain || 'unknown');
  const opportunityId = String(input.opportunityId || '');

  if (policy === 'off' || policy === 'restricted') return Object.freeze({ allowed:false, reason:'commercial_policy' });
  if (['high','critical','unknown'].includes(risk)) return Object.freeze({ allowed:false, reason:'risk' });
  if (NEVER_MONETIZE_DOMAINS.includes(domain)) return Object.freeze({ allowed:false, reason:'domain' });
  if (hasBlockedFlag(input.flags)) return Object.freeze({ allowed:false, reason:'safety_flag' });
  if (!PUBLIC_COMMERCIAL_OPPORTUNITIES.includes(opportunityId)) return Object.freeze({ allowed:false, reason:'opportunity_not_public' });
  if (input.partnerVerified !== true) return Object.freeze({ allowed:false, reason:'partner_not_verified' });
  if (input.partnerQualityStatus === 'suspended') return Object.freeze({ allowed:false, reason:'partner_suspended' });
  if (risk === 'medium' && input.explicitIntent !== true) return Object.freeze({ allowed:false, reason:'explicit_intent_required' });
  if (input.requiresConsent !== false && input.consent !== true) return Object.freeze({ allowed:false, reason:'consent_required' });

  return Object.freeze({ allowed:true, reason:'eligible_verified_partner' });
}

export function evaluateAdSurface({ pathname='/', publisherId='', cmpReady=false, consent=false } = {}) {
  const validPublisher = /^ca-pub-\d{6,}$/.test(String(publisherId));
  if (!validPublisher) return Object.freeze({ allowed:false, reason:'publisher_not_configured' });
  if (!cmpReady) return Object.freeze({ allowed:false, reason:'cmp_not_ready' });
  if (!consent) return Object.freeze({ allowed:false, reason:'consent_missing' });
  if (AD_BLOCKED_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(prefix))) {
    return Object.freeze({ allowed:false, reason:'sensitive_route' });
  }
  if (!AD_SAFE_PATHS.includes(pathname)) return Object.freeze({ allowed:false, reason:'route_not_allowlisted' });
  return Object.freeze({ allowed:true, reason:'ad_safe_route' });
}

export function storyCommercialPolicy({ isRealUserContent=false, risk='unknown' } = {}) {
  if (isRealUserContent) return Object.freeze({ allowed:false, reason:'real_story_no_monetization' });
  if (['high','critical','unknown'].includes(String(risk).toLowerCase())) return Object.freeze({ allowed:false, reason:'story_risk' });
  return Object.freeze({ allowed:false, reason:'editorial_stories_default_off' });
}
