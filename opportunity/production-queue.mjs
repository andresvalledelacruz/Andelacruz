import { rankCandidates } from './scoring.mjs';

export const PRODUCTION_STATES = Object.freeze({ RESEARCH:'RESEARCH', READY:'READY', BUILD:'BUILD', REVIEW:'REVIEW', PUBLISH:'PUBLISH', MEASURE:'MEASURE' });

export const DEFAULT_PORTFOLIO_POLICY = Object.freeze({
  limit:20,
  maxPerDomain:6,
  maxHighRisk:5,
  minConfidenceForReady:0.48,
  minConfidenceForBuild:0.58,
  reserveLowRisk:6
});

function nextState(item, policy) {
  if (item.manualReview && item.confidence < policy.minConfidenceForBuild) return PRODUCTION_STATES.RESEARCH;
  if (item.confidence < policy.minConfidenceForReady) return PRODUCTION_STATES.RESEARCH;
  if (item.confidence < policy.minConfidenceForBuild) return PRODUCTION_STATES.READY;
  return PRODUCTION_STATES.BUILD;
}

export function buildProductionQueue(candidates, options = {}) {
  const policy = { ...DEFAULT_PORTFOLIO_POLICY, ...(options.policy || {}) };
  const ranked = rankCandidates(candidates, { limit:candidates.length, evidenceByCandidate:options.evidenceByCandidate || {} });
  const selected = [];
  const domainCounts = new Map();
  let highRisk = 0;

  for (const item of ranked) {
    if (selected.length >= policy.limit) break;
    const count = domainCounts.get(item.domain) || 0;
    if (count >= policy.maxPerDomain) continue;
    if ((item.risk === 'high' || item.risk === 'critical') && highRisk >= policy.maxHighRisk) continue;
    selected.push(item);
    domainCounts.set(item.domain, count + 1);
    if (item.risk === 'high' || item.risk === 'critical') highRisk++;
  }

  if (selected.filter(x => x.risk === 'low').length < policy.reserveLowRisk) {
    const lowRiskPool = ranked.filter(x => x.risk === 'low' && !selected.some(s => s.id === x.id));
    while (selected.filter(x => x.risk === 'low').length < policy.reserveLowRisk && lowRiskPool.length) {
      const replacement = lowRiskPool.shift();
      let replaceIndex = -1;
      for (let i = selected.length - 1; i >= 0; i--) {
        if (selected[i].risk !== 'low') { replaceIndex = i; break; }
      }
      if (replaceIndex < 0) break;
      selected[replaceIndex] = replacement;
    }
  }

  return selected.sort((a,b)=>b.score-a.score).map((item,index)=>Object.freeze({
    queueRank:index+1,
    candidateId:item.id,
    title:item.title,
    slug:item.slug,
    domain:item.domain,
    score:item.score,
    confidence:item.confidence,
    risk:item.risk,
    state:nextState(item, policy),
    manualReview:item.manualReview,
    evidenceCoverage:item.evidence?.resolution?.evidenceCoverage ?? 0,
    reasons:item.reasons
  }));
}

export function queueSummary(queue = []) {
  const byState = {}, byDomain = {};
  for (const item of queue) {
    byState[item.state] = (byState[item.state] || 0) + 1;
    byDomain[item.domain] = (byDomain[item.domain] || 0) + 1;
  }
  return Object.freeze({ total:queue.length, byState:Object.freeze(byState), byDomain:Object.freeze(byDomain), highRisk:queue.filter(x=>x.risk==='high'||x.risk==='critical').length, lowRisk:queue.filter(x=>x.risk==='low').length });
}
