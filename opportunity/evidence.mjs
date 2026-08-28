const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, Number(n) || 0));

export const EVIDENCE_STATUS = Object.freeze({
  HYPOTHESIS: 'hypothesis',
  PARTIAL: 'partial',
  MEASURED: 'measured'
});

const SOURCE_RELIABILITY = Object.freeze({
  editorial_seed: 0.25,
  search_console: 0.95,
  analytics: 0.90,
  conversion_tracking: 0.95,
  partner_report: 0.80,
  manual_research: 0.60
});

function reliability(source) {
  return SOURCE_RELIABILITY[source] ?? 0.40;
}

export function normalizeSeoEvidence(evidence = {}) {
  if (!evidence || !Object.keys(evidence).length) return null;
  const impressions = Math.max(0, Number(evidence.impressions) || 0);
  const clicks = Math.max(0, Number(evidence.clicks) || 0);
  const position = Math.max(1, Number(evidence.position) || 100);
  const ctr = impressions ? clicks / impressions : 0;
  const demand = clamp(Math.log10(impressions + 1) * 22);
  const traction = clamp(ctr * 600);
  const positionOpportunity = clamp((30 - Math.min(position, 30)) * 3.33);
  const score = clamp(demand * 0.50 + traction * 0.20 + positionOpportunity * 0.30);
  return { score: Number(score.toFixed(2)), reliability: reliability(evidence.source || 'search_console') };
}

export function normalizeCommercialEvidence(evidence = {}) {
  if (!evidence || !Object.keys(evidence).length) return null;
  const leads = Math.max(0, Number(evidence.leads) || 0);
  const conversions = Math.max(0, Number(evidence.conversions) || 0);
  const revenue = Math.max(0, Number(evidence.revenue) || 0);
  const sessions = Math.max(0, Number(evidence.sessions) || 0);
  const conversionRate = sessions ? conversions / sessions : 0;
  const leadSignal = clamp(Math.log10(leads + 1) * 35);
  const conversionSignal = clamp(conversionRate * 1000);
  const revenueSignal = clamp(Math.log10(revenue + 1) * 28);
  const score = clamp(leadSignal * 0.25 + conversionSignal * 0.45 + revenueSignal * 0.30);
  return { score: Number(score.toFixed(2)), reliability: reliability(evidence.source || 'conversion_tracking') };
}

export function blendHypothesisWithEvidence(hypothesis, measured) {
  const base = clamp(hypothesis);
  if (!measured) return { value: base, evidenceWeight: 0, status: EVIDENCE_STATUS.HYPOTHESIS };
  const evidenceWeight = Math.min(0.90, Math.max(0.20, Number(measured.reliability) || 0.40));
  const value = clamp(base * (1 - evidenceWeight) + clamp(measured.score) * evidenceWeight);
  return {
    value: Number(value.toFixed(2)),
    evidenceWeight: Number(evidenceWeight.toFixed(2)),
    status: evidenceWeight >= 0.75 ? EVIDENCE_STATUS.MEASURED : EVIDENCE_STATUS.PARTIAL
  };
}

export function resolveCandidateEvidence(candidate = {}, measured = {}) {
  const seoMeasured = normalizeSeoEvidence(measured.seo);
  const commercialMeasured = normalizeCommercialEvidence(measured.commercial);
  const seo = blendHypothesisWithEvidence(candidate.seoValue, seoMeasured);
  const commercial = candidate.commercialPolicy === 'off'
    ? { value: 0, evidenceWeight: 1, status: EVIDENCE_STATUS.MEASURED }
    : blendHypothesisWithEvidence(candidate.commercialValue, commercialMeasured);
  const weights = [seo.evidenceWeight, commercial.evidenceWeight];
  const evidenceCoverage = Number((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2));
  const baseConfidence = Math.min(1, Math.max(0, Number(candidate.confidence ?? 0.5)));
  const confidence = Number(Math.min(1, baseConfidence * 0.65 + evidenceCoverage * 0.35).toFixed(2));
  return Object.freeze({ seo, commercial, evidenceCoverage, confidence });
}
