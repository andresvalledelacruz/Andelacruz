export const DISCIPLINES = Object.freeze({
  psychology:{scope:'psychoeducation_and_support',clinicalBadgeRequiresIdentifiedReviewer:true},
  psychiatry:{scope:'general_information_and_referral',clinicalBadgeRequiresIdentifiedReviewer:true},
  socialWork:{scope:'public_resources_rights_and_practical_support',clinicalBadgeRequiresIdentifiedReviewer:false},
  safeguarding:{scope:'safety_protection_and_escalation',clinicalBadgeRequiresIdentifiedReviewer:false},
  legal:{scope:'general_legal_information_and_referral',clinicalBadgeRequiresIdentifiedReviewer:true},
  finance:{scope:'financial_education_and_referral',clinicalBadgeRequiresIdentifiedReviewer:true}
});

export const CLINICAL_BOUNDARIES = Object.freeze([
  'no_automatic_diagnosis','no_prescription','no_medication_adjustment','no_treatment_guarantees',
  'no_fake_clinical_review','official_sources_first_high_risk','emergency_112_when_immediate_danger',
  'suicide_024_when_applicable','016_scope_accurate','no_mediation_active_abuse','minors_safeguarding',
  'protective_factors_never_downgrade_critical','ambiguity_clarify_not_guess','grief_not_pathologized_by_time_alone',
  'legal_financial_issues_not_psychologized','commercial_conflict_never_changes_safety_content'
]);

export const REVIEW_LABELS = Object.freeze({
  EDITORIAL:'Revisión editorial',
  SOURCES_CHECKED:'Fuentes comprobadas',
  PROFESSIONAL_REVIEWED:'Revisado por profesional identificado',
  CLINICAL_REVIEWED:'Revisión clínica identificada'
});

export function canUseProfessionalReviewLabel(review = {}) {
  if (!review.reviewerName || !review.reviewedAt || !review.scope) return false;
  if (review.discipline === 'psychology' || review.discipline === 'psychiatry') {
    return Boolean(review.credentialsVerified && review.registrationOrLicenseChecked);
  }
  return Boolean(review.credentialsVerified);
}

export function contentSafetyDecision(input = {}) {
  const risk = String(input.risk || 'unknown').toLowerCase();
  const flags = new Set(input.flags || []);
  if (flags.has('critical_safety') || flags.has('urgent_health') || flags.has('urgent_protection')) {
    return Object.freeze({priority:'P0',commercial:false,professionalEscalation:true});
  }
  if (risk === 'high' || flags.has('minor_protection')) {
    return Object.freeze({priority:'P1',commercial:false,professionalEscalation:true});
  }
  if (risk === 'medium') return Object.freeze({priority:'P2',commercial:'contextual_verified_only',professionalEscalation:false});
  return Object.freeze({priority:'NONE',commercial:'low_risk_only',professionalEscalation:false});
}

export function psychiatricContentAllowed(input = {}) {
  if (input.containsDiagnosis || input.containsPrescription || input.containsMedicationChange) return false;
  return input.generalInformation === true && input.referralBoundaryVisible === true;
}
