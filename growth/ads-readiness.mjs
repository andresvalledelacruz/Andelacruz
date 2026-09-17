import { evaluateAdSurface } from './revenue-policy.mjs';

export const ADS_STATE = Object.freeze({
  enabled:false,
  publisherId:null,
  cmpReady:false,
  personalizedAds:false,
  allowLimitedAds:true,
  requireRecertification:true
});

export const ADS_ACTIVATION_REQUIREMENTS = Object.freeze([
  'real_publisher_id','google_certified_cmp_or_equivalent_compliant_flow','privacy_policy_updated',
  'cookie_policy_updated','transparency_page_updated','ads_txt_real_entries_only','performance_retest',
  'consent_retest_eea_uk_ch','no_sensitive_route_coverage','production_sha_recertified'
]);

export function adActivationDecision({pathname='/',publisherId=ADS_STATE.publisherId,cmpReady=ADS_STATE.cmpReady,consent=false}={}) {
  return evaluateAdSurface({pathname,publisherId:publisherId || '',cmpReady,consent});
}

export function publisherConfigured(publisherId) {
  return /^ca-pub-\d{6,}$/.test(String(publisherId || ''));
}
