export const PARTNER_STATUS = Object.freeze({ DRAFT:'draft', ACTIVE:'active', PAUSED:'paused', REJECTED:'rejected' });

export const PARTNERS = [];

export function registerPartner(partner) {
  const required = ['id','name','opportunities','territories','status'];
  for (const key of required) {
    if (!partner?.[key] || (Array.isArray(partner[key]) && partner[key].length === 0)) {
      throw new Error(`Missing partner field: ${key}`);
    }
  }
  if (!Array.isArray(partner.opportunities) || !Array.isArray(partner.territories)) {
    throw new Error('Partner opportunities and territories must be arrays');
  }
  return Object.freeze({
    compensation: null,
    disclosure: null,
    verification: 'pending',
    qualityScore: null,
    ...partner
  });
}

export function findEligiblePartners({ opportunityId, territory = 'ES', registry = PARTNERS }) {
  return registry.filter(p =>
    p.status === PARTNER_STATUS.ACTIVE &&
    p.verification === 'verified' &&
    p.opportunities.includes(opportunityId) &&
    (p.territories.includes(territory) || p.territories.includes('*'))
  );
}
