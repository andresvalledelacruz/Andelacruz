import { MONETIZATION, OPPORTUNITIES, SAFETY_BLOCK_FLAGS } from './registry.mjs';

export function evaluateOpportunity(input = {}) {
  const flags = new Set(input.flags || []);
  const intents = new Set(input.intents || []);
  const needs = new Set(input.needs || []);

  if (SAFETY_BLOCK_FLAGS.some(flag => flags.has(flag))) {
    return { monetization: MONETIZATION.OFF, opportunities: [], reason: 'safety_gate' };
  }

  const candidates = [];
  const add = (id, reason) => {
    const def = OPPORTUNITIES[id];
    if (!def) return;
    if (def.explicitIntentRequired && !intents.has(id)) return;
    if (def.affordabilityRequired && !flags.has('affordability_checked')) return;
    candidates.push({ id, reason, risk: def.risk, category: def.category, models: def.models });
  };

  if (needs.has('find_job')) add('JOB_SEARCH', 'employment_need');
  if (needs.has('cv_help')) add('CV_SERVICE', 'cv_bottleneck');
  if (needs.has('interview_help')) add('INTERVIEW_COACHING', 'interview_bottleneck');
  if (needs.has('training_gap') && flags.has('market_evidence')) add('TRAINING', 'verified_skill_gap');
  if (needs.has('labor_legal')) add('LEGAL_LABOR', 'labor_legal_need');
  if (needs.has('psychological_support')) add('PSYCHOLOGY', 'support_need');
  if (needs.has('couples_support')) add('COUPLES_THERAPY', 'relationship_support_need');
  if (needs.has('family_mediation')) add('FAMILY_MEDIATION', 'mediation_need');
  if (needs.has('debt_advice')) add('DEBT_ADVICE', 'debt_need');
  if (needs.has('insolvency_legal')) add('INSOLVENCY_LEGAL', 'insolvency_need');
  if (needs.has('mortgage_help')) add('MORTGAGE_HELP', 'housing_finance_need');
  if (needs.has('care_services')) add('CARE_SERVICES', 'care_need');
  if (needs.has('senior_residence')) add('SENIOR_RESIDENCE', 'residential_care_need');
  if (needs.has('home_services')) add('HOME_SERVICES', 'home_service_need');

  for (const id of intents) add(id, 'explicit_intent');

  if (!candidates.length) {
    return { monetization: MONETIZATION.OFF, opportunities: [], reason: 'no_valid_opportunity' };
  }

  return { monetization: MONETIZATION.PARTNER_REQUIRED, opportunities: candidates, reason: 'eligible_candidates' };
}
