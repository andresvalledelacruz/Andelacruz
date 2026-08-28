import { resolveCandidateEvidence } from './evidence.mjs';
import { applyLearningPolicy, learningAdjustedScore } from './learning-policy.mjs';

const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, Number(n) || 0));

export const DEFAULT_SCORING_CONFIG = Object.freeze({
  weights: Object.freeze({ userValue: 0.40, seoValue: 0.25, commercialValue: 0.25, strategicFit: 0.10 }),
  riskPenalty: Object.freeze({ low: 4, medium: 12, high: 26, critical: 50 }),
  confidenceFloor: 0.70,
  confidenceWeight: 0.30,
  minimumUserValue: 35,
  manualReviewRisk: 'high'
});

const RISK_ORDER = Object.freeze({ low: 1, medium: 2, high: 3, critical: 4 });

export function validateCandidate(candidate = {}) {
  const required = ['id', 'slug', 'title', 'domain', 'userValue', 'seoValue', 'commercialValue', 'strategicFit', 'risk'];
  for (const key of required) if (candidate[key] === undefined || candidate[key] === null || candidate[key] === '') throw new Error(`Missing scoring field: ${key}`);
  if (!RISK_ORDER[candidate.risk]) throw new Error(`Invalid risk: ${candidate.risk}`);
  return true;
}

function strongestLearningSignal(candidate, learningSignals = {}) {
  const signals = (candidate.opportunities || []).map(id => learningSignals[id]).filter(Boolean);
  if (!signals.length) return {};
  return signals.sort((a,b)=>(Number(b.sampleSize)||0)-(Number(a.sampleSize)||0) || Math.abs(Number(b.outcomeScore)||0)-Math.abs(Number(a.outcomeScore)||0))[0];
}

export function scoreCandidate(candidate, config = DEFAULT_SCORING_CONFIG, measuredEvidence = {}, learningSignal = {}) {
  validateCandidate(candidate);
  const w = config.weights;
  const userValue = clamp(candidate.userValue);
  const evidenceResolution = resolveCandidateEvidence(candidate, measuredEvidence);
  const seoValue = clamp(evidenceResolution.seo.value);
  const commercialValue = candidate.commercialPolicy === 'off' ? 0 : clamp(evidenceResolution.commercial.value);
  const strategicFit = clamp(candidate.strategicFit);
  const confidence = evidenceResolution.confidence;

  const weightedValue = userValue * w.userValue + seoValue * w.seoValue + commercialValue * w.commercialValue + strategicFit * w.strategicFit;
  const riskPenalty = Number(config.riskPenalty[candidate.risk] ?? 0);
  const rawScore = clamp(weightedValue - riskPenalty);
  const confidenceFactor = config.confidenceFloor + config.confidenceWeight * confidence;
  const preLearningScore = Number((rawScore * confidenceFactor).toFixed(2));
  const learning = applyLearningPolicy({userValue,commercial:commercialValue>0},learningSignal);
  const priorityScore = learningAdjustedScore(preLearningScore, learning);

  const reasons = [];
  if (userValue >= 75) reasons.push('high_user_value');
  if (seoValue >= 70) reasons.push(evidenceResolution.seo.status === 'hypothesis' ? 'high_seo_hypothesis' : 'high_seo_signal');
  if (commercialValue >= 70) reasons.push(evidenceResolution.commercial.status === 'hypothesis' ? 'high_commercial_hypothesis' : 'high_commercial_signal');
  if (strategicFit >= 75) reasons.push('strong_cluster_fit');
  if (candidate.risk === 'high' || candidate.risk === 'critical') reasons.push('manual_review_required');
  if (confidence < 0.5) reasons.push('low_evidence_confidence');
  if (evidenceResolution.evidenceCoverage >= 0.5) reasons.push('measured_evidence_available');
  if (learning.learningAdjustment > 0) reasons.push('positive_outcome_learning');
  if (learning.learningAdjustment < 0) reasons.push('negative_outcome_learning');

  const blocked = userValue < config.minimumUserValue || candidate.blocked === true;
  return Object.freeze({
    id: candidate.id, slug: candidate.slug, title: candidate.title, domain: candidate.domain,
    score: priorityScore, preLearningScore, rawScore: Number(rawScore.toFixed(2)), confidence, risk: candidate.risk,
    riskPenalty, blocked, manualReview: RISK_ORDER[candidate.risk] >= RISK_ORDER[config.manualReviewRisk],
    dimensions: Object.freeze({ userValue, seoValue, commercialValue, strategicFit }),
    evidence: Object.freeze({ ...candidate.evidence, resolution: evidenceResolution }),
    learning:Object.freeze({adjustment:learning.learningAdjustment,status:learning.learningStatus,sampleSize:Number(learningSignal.sampleSize)||0}),
    opportunities: candidate.opportunities || [], reasons
  });
}

export function rankCandidates(candidates = [], options = {}) {
  const { limit = candidates.length, includeBlocked = false, config = DEFAULT_SCORING_CONFIG, evidenceByCandidate = {}, learningSignals = {} } = options;
  return candidates.map(candidate => scoreCandidate(candidate, config, evidenceByCandidate[candidate.id] || {}, strongestLearningSignal(candidate, learningSignals)))
    .filter(result => includeBlocked || !result.blocked)
    .sort((a, b) => b.score - a.score || b.confidence - a.confidence || b.dimensions.userValue - a.dimensions.userValue || a.title.localeCompare(b.title, 'es'))
    .slice(0, limit).map((item, index) => Object.freeze({ rank: index + 1, ...item }));
}

export function explainScore(result) {
  return { rankScore: result.score, preLearningScore:result.preLearningScore, learning:result.learning, confidence: result.confidence, risk: result.risk, dimensions: result.dimensions, evidence: result.evidence?.resolution, reasons: result.reasons, note: 'Outcome learning is bounded by policy and cannot override user-value and safety constraints.' };
}
