import { PUBLIC_COMMERCIAL_OPPORTUNITIES } from './revenue-policy.mjs';

export const REGULATED_OPPORTUNITIES = Object.freeze([
  'PSYCHOLOGY','COUPLES_THERAPY','FAMILY_THERAPY','LEGAL_LABOR','FAMILY_LEGAL',
  'DEBT_ADVICE','DEBT_CONSOLIDATION','LOAN','INSOLVENCY_LEGAL','MORTGAGE_HELP','INSURANCE'
]);

export const PUBLIC_RUNTIME_MODELS = Object.freeze(['affiliate','cpl','cpa','booking','revenue_share','marketplace']);

export function validatePartner(partner = {}) {
  const issues = [];
  if (!partner.id) issues.push('missing_id');
  if (!partner.displayName) issues.push('missing_display_name');
  if (!partner.legalName) issues.push('missing_legal_name');
  if (!partner.websiteDomain) issues.push('missing_website_domain');
  if (partner.status !== 'active') issues.push('partner_not_active');
  if (partner.verification !== 'verified') issues.push('partner_not_verified');
  if (partner.qualityStatus === 'suspended') issues.push('partner_suspended');
  if (partner.verificationExpiresAt && new Date(partner.verificationExpiresAt).getTime() <= Date.now()) issues.push('verification_expired');
  if (!partner.disclosure) issues.push('missing_disclosure');
  if (partner.qualityScore != null && (Number(partner.qualityScore) < 0 || Number(partner.qualityScore) > 100)) issues.push('quality_score_out_of_range');
  return Object.freeze({ valid: issues.length === 0, issues:Object.freeze(issues) });
}

export function validateOffer(offer = {}, partner = {}) {
  const issues = [...validatePartner(partner).issues];
  if (!offer.id) issues.push('missing_offer_id');
  if (!PUBLIC_COMMERCIAL_OPPORTUNITIES.includes(offer.opportunityId)) issues.push('opportunity_not_public');
  if (!/^https:\/\/[^\s]+$/i.test(String(offer.destinationUrl || ''))) issues.push('destination_not_https');
  if (!offer.disclosure && !partner.disclosure) issues.push('missing_offer_disclosure');
  if (!PUBLIC_RUNTIME_MODELS.includes(offer.compensationModel)) issues.push('invalid_compensation_model');
  if (!['ES','*'].includes(offer.territory)) issues.push('unsupported_territory');
  if (offer.status !== 'active') issues.push('offer_not_active');
  return Object.freeze({ valid: issues.length === 0, issues:Object.freeze([...new Set(issues)]) });
}

export function rankVerifiedOffers(offers = []) {
  return [...offers]
    .filter(item => validateOffer(item.offer || item, item.partner || item).valid)
    .sort((a, b) => {
      const aPartner = a.partner || a;
      const bPartner = b.partner || b;
      const quality = Number(bPartner.qualityScore ?? 50) - Number(aPartner.qualityScore ?? 50);
      if (quality) return quality;
      return String((a.offer || a).id).localeCompare(String((b.offer || b).id));
    });
}

export function regulatedPartnerRequirements(opportunityId) {
  if (!REGULATED_OPPORTUNITIES.includes(opportunityId)) return Object.freeze([]);
  return Object.freeze([
    'identity_verified','professional_or_regulatory_status_verified','conflicts_disclosed',
    'complaints_process_available','verification_expiry_set','manual_activation_required'
  ]);
}
