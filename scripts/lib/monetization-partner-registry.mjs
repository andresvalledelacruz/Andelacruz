const VALID_STATUSES = new Set(['denied', 'candidate_review', 'hold', 'approved']);
const REQUIRED_APPROVAL_FIELDS = Object.freeze([
  'legal_entity_name',
  'destination_domain',
  'network_name',
  'territories',
  'commission_model',
  'disclosure_copy',
  'refund_or_cancellation_reviewed',
  'claims_reviewed',
  'privacy_reviewed',
  'due_diligence_complete'
]);

function safeText(value, max = 300) {
  const text = String(value ?? '').trim();
  if (!text || text.length > max || /[<>]/.test(text)) return null;
  return text;
}

function normalizeDomain(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text || text.includes('/') || text.includes(':') || text.includes('@') || text.includes(' ') || !text.includes('.')) return null;
  return text;
}

export function validatePartnerRegistry(registry = {}) {
  const errors = [];
  if (registry.version !== 1) errors.push('registry_version_invalid');
  if (registry.default_status !== 'denied') errors.push('default_must_be_denied');
  if (registry.activation_enabled !== false) errors.push('activation_must_remain_disabled');
  if (!Array.isArray(registry.partners)) errors.push('partners_must_be_array');

  const seen = new Set();
  for (const [index, partner] of (Array.isArray(registry.partners) ? registry.partners : []).entries()) {
    const id = safeText(partner?.id, 80);
    if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) errors.push(`partner_${index}_id_invalid`);
    else if (seen.has(id)) errors.push(`partner_${index}_id_duplicate`);
    else seen.add(id);

    if (!VALID_STATUSES.has(partner?.status)) errors.push(`partner_${index}_status_invalid`);
    if (partner?.status !== 'approved' && partner?.approved === true) errors.push(`partner_${index}_implicit_approval_forbidden`);
    if (partner?.status === 'approved' && partner?.approved !== true) errors.push(`partner_${index}_approved_requires_true`);

    if (partner?.status === 'approved') {
      for (const field of REQUIRED_APPROVAL_FIELDS) {
        const value = partner?.[field];
        if (field === 'destination_domain') {
          if (!normalizeDomain(value)) errors.push(`partner_${index}_${field}_invalid`);
        } else if (field === 'territories') {
          if (!Array.isArray(value) || value.length === 0 || value.some((item) => !/^[A-Z]{2}$/.test(String(item)))) errors.push(`partner_${index}_${field}_invalid`);
        } else if (field.endsWith('_reviewed') || field === 'due_diligence_complete') {
          if (value !== true) errors.push(`partner_${index}_${field}_required`);
        } else if (!safeText(value, 1000)) {
          errors.push(`partner_${index}_${field}_required`);
        }
      }
      if (partner?.employment_guarantee_claim === true) errors.push(`partner_${index}_employment_guarantee_forbidden`);
      if (partner?.paid_editorial_ranking === true) errors.push(`partner_${index}_paid_editorial_ranking_forbidden`);
    }
  }

  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export function resolvePartner(registry = {}, partnerId) {
  const id = safeText(partnerId, 80);
  if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) return Object.freeze({ id:null, status:'denied', approved:false, reason:'invalid_partner_id' });
  const validation = validatePartnerRegistry(registry);
  if (!validation.valid) return Object.freeze({ id, status:'denied', approved:false, reason:'registry_invalid' });
  if (registry.activation_enabled !== false) return Object.freeze({ id, status:'denied', approved:false, reason:'activation_flag_invalid' });

  const partner = registry.partners.find((entry) => entry.id === id);
  if (!partner) return Object.freeze({ id, status:'denied', approved:false, reason:'not_registered' });
  if (partner.status !== 'approved' || partner.approved !== true) {
    return Object.freeze({ id, status:partner.status, approved:false, reason:'not_approved' });
  }
  return Object.freeze({
    id,
    status:'approved',
    approved:true,
    legal_entity_name:partner.legal_entity_name,
    destination_domain:partner.destination_domain,
    network_name:partner.network_name,
    territories:Object.freeze([...partner.territories]),
    commission_model:partner.commission_model,
    disclosure_copy:partner.disclosure_copy,
    reason:'approved_partner'
  });
}

export function partnerRegistryCapabilities() {
  return Object.freeze({
    version:1,
    default_denied:true,
    activation_side_effects:false,
    unknown_partners_denied:true,
    employment_guarantee_claims_forbidden:true,
    paid_editorial_ranking_forbidden:true,
    required_approval_fields:REQUIRED_APPROVAL_FIELDS
  });
}
