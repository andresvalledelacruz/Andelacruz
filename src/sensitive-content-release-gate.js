import { sensitiveSourceById } from './sensitive-source-registry.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_SOURCE_AGE_DAYS = 120;

const FRONT_MODES = Object.freeze({
  cancer: new Set(['diagnosis_wait', 'recent_diagnosis', 'consultation_preparation', 'treatment', 'side_effects', 'caregivers', 'work_admin', 'anticipatory_grief', 'survivorship']),
  accidental_emergencies: new Set(['prevention', 'emergency', 'aftercare'])
});

const REQUIRED_REVIEWS = Object.freeze({
  cancer: Object.freeze({
    default: ['clinical', 'editorial'],
    work_admin: ['clinical', 'editorial', 'legal']
  }),
  accidental_emergencies: Object.freeze({
    prevention: ['safety', 'editorial'],
    emergency: ['emergency_clinical', 'safety', 'editorial'],
    aftercare: ['emergency_clinical', 'safety', 'editorial']
  })
});

function normalizeToken(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function validDate(value) {
  const timestamp = Date.parse(String(value || ''));
  return Number.isFinite(timestamp) ? timestamp : null;
}

function sourceAudit(sources, asOf, front, mode) {
  const asOfTimestamp = validDate(asOf);
  if (asOfTimestamp === null) return { valid: [], invalid: ['as_of_date_required'] };

  const valid = [];
  const invalid = [];
  for (const [index, evidence] of (Array.isArray(sources) ? sources : []).entries()) {
    const sourceId = typeof evidence === 'string' ? evidence : evidence?.id;
    const source = sensitiveSourceById(sourceId);
    if (!source) {
      invalid.push(`source_${index + 1}_unregistered`);
      continue;
    }
    const url = source.url;
    const verifiedAt = validDate(source.verified_at);
    const official = source.authority === 'official_government' || source.authority === 'clinical_consensus';
    const frontAllowed = source.fronts.includes(front);
    const modeAllowed = source.modes === '*' || source.modes.includes(mode);
    const ageDays = verifiedAt === null ? Infinity : Math.floor((asOfTimestamp - verifiedAt) / DAY_MS);
    if (!url.startsWith('https://') || !official || !frontAllowed || !modeAllowed || ageDays < 0 || ageDays > MAX_SOURCE_AGE_DAYS) {
      invalid.push(`source_${index + 1}`);
    } else {
      valid.push({ id: sourceId, url, verified_at: source.verified_at, age_days: ageDays });
    }
  }
  if (valid.length === 0) invalid.push('current_official_source_required');
  return { valid, invalid: [...new Set(invalid)] };
}

function reviewAudit(required, reviews) {
  const supplied = reviews && typeof reviews === 'object' ? reviews : {};
  return required.filter((role) => {
    const review = supplied[role];
    return review?.approved !== true || review?.credential_verified !== true || validDate(review?.reviewed_at) === null;
  });
}

export function evaluateSensitiveContentRelease(input = {}) {
  const front = normalizeToken(input.front);
  const mode = normalizeToken(input.mode);
  const knownFront = Object.hasOwn(FRONT_MODES, front);
  const knownMode = knownFront && FRONT_MODES[front].has(mode);
  const immediateRisk = input.immediate_risk === true || mode === 'emergency';
  const sources = sourceAudit(input.sources, input.as_of, front, mode);

  const requiredReviews = !knownFront || !knownMode
    ? ['safety', 'editorial']
    : front === 'cancer'
      ? (REQUIRED_REVIEWS.cancer[mode] || REQUIRED_REVIEWS.cancer.default)
      : REQUIRED_REVIEWS.accidental_emergencies[mode];
  const missingReviews = reviewAudit(requiredReviews, input.reviews);
  const blocked = !knownFront || !knownMode || sources.invalid.length > 0 || missingReviews.length > 0;

  return {
    version: 1,
    front,
    mode,
    decision: immediateRisk ? 'SAFETY_GATEWAY' : blocked ? 'HOLD_REVIEW_REQUIRED' : 'READY_FOR_IMPLEMENTATION',
    publication_allowed: !immediateRisk && !blocked,
    draft_preparation_allowed: knownFront && knownMode,
    commercial_ui_allowed: false,
    automated_individual_advice_allowed: false,
    requires_112_first: front === 'accidental_emergencies' && mode === 'emergency',
    required_reviews: requiredReviews,
    missing_reviews: missingReviews,
    valid_sources: sources.valid,
    invalid_source_evidence: sources.invalid,
    unknown_front: knownFront ? null : front || 'missing',
    unknown_mode: knownMode ? null : mode || 'missing',
    prohibitions: ['diagnosis', 'individual_prognosis', 'prescription', 'unreviewed_emergency_instructions', 'commercial_cta', 'sensitive_targeting']
  };
}

export function sensitiveContentFronts() {
  return Object.keys(FRONT_MODES);
}


