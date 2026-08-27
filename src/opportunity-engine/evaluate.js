import { globalMonetizationBlockSignals, opportunityRegistry } from './registry.js';

function hasAll(required, signals) {
  return required.every((signal) => signals.has(signal));
}

function hasAny(blocked, signals) {
  return blocked.some((signal) => signals.has(signal));
}

export function evaluateOpportunities(input = {}, registry = opportunityRegistry) {
  const signals = new Set(input.signals || []);
  const explicitIntents = new Set(input.explicitIntents || []);
  const locale = input.locale || 'es-ES';
  const commercialConsent = input.commercialConsent === true;

  const globalBlocks = [...globalMonetizationBlockSignals].filter((signal) => signals.has(signal));
  if (globalBlocks.length > 0) {
    return {
      monetization: 'off',
      reason: 'safety_gate',
      blockedBy: globalBlocks,
      locale,
      candidates: []
    };
  }

  const candidates = registry
    .filter((opportunity) => hasAll(opportunity.requiredSignals, signals))
    .filter((opportunity) => !hasAny(opportunity.blockedSignals || [], signals))
    .filter((opportunity) => {
      if (!opportunity.requiresExplicitIntent) return true;
      return explicitIntents.has(opportunity.id);
    })
    .map((opportunity) => ({
      id: opportunity.id,
      category: opportunity.category,
      label: opportunity.label,
      models: opportunity.models,
      status: opportunity.status,
      partnerRequirements: opportunity.partnerRequirements,
      canShowCommercialCta: commercialConsent && opportunity.status === 'active_partner'
    }));

  return {
    monetization: candidates.length ? 'opportunity_detected' : 'none',
    reason: candidates.length ? 'eligible_rules_match' : 'no_rules_match',
    locale,
    commercialConsent,
    candidates
  };
}
