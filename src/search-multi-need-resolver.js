import { routeSearchQuery } from './search-crisis-router.js';

const SAFETY_RANK = Object.freeze({ P0: 300, P1: 200, NONE: 100 });
const CONFIDENCE_RANK = Object.freeze({ high: 20, medium: 10, low: 0 });

function freezeNeed(result, firstSeen) {
  return Object.freeze({
    intent: result.intent ?? null,
    confidence: result.confidence ?? null,
    route: result.route ? Object.freeze({ ...result.route }) : null,
    safety_level: result.safety_level ?? 'NONE',
    urgent: result.urgent === true,
    official_resources_spain: Object.freeze([...(result.official_resources_spain ?? [])]),
    first_seen: firstSeen
  });
}

function splitCandidateClauses(query) {
  return String(query ?? '')
    .split(/(?:[.;,!?\n]+|\s+(?:pero|además|ademas|también|tambien|y)\s+)/iu)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function needScore(need) {
  return (SAFETY_RANK[need.safety_level] ?? 0)
    + (need.urgent ? 30 : 0)
    + (CONFIDENCE_RANK[need.confidence] ?? 0);
}

function sortNeeds(a, b) {
  const scoreDiff = needScore(b) - needScore(a);
  if (scoreDiff !== 0) return scoreDiff;
  return a.first_seen - b.first_seen;
}

function dedupeContexts(contexts) {
  return Object.freeze([...new Set(contexts.filter(Boolean))]);
}

export function resolveMultipleNeeds(query = '') {
  const full = routeSearchQuery(query);
  const matches = new Map();
  const unresolvedSafetyContexts = [];

  if (full.needs_clarification && full.suppress_commercial_ui) {
    unresolvedSafetyContexts.push(full.context ?? 'unresolved_safety');
  }

  const clauses = splitCandidateClauses(query);
  clauses.forEach((clause, index) => {
    const result = routeSearchQuery(clause);

    if (result.needs_clarification && result.suppress_commercial_ui) {
      unresolvedSafetyContexts.push(result.context ?? 'unresolved_safety');
    }

    if (result.matched && result.route?.url && !matches.has(result.route.url)) {
      matches.set(result.route.url, freezeNeed(result, index));
    }
  });

  // The complete sentence may catch Safety language spanning clauses, but it must
  // not override an explicit unresolved/negated Safety context recovered from a
  // clause. Clause-level evidence is therefore the confirmation layer.
  const fullIsSafety = full.matched && ['P0', 'P1'].includes(full.safety_level);
  if (full.matched && full.route?.url && !matches.has(full.route.url)) {
    if (!fullIsSafety || unresolvedSafetyContexts.length === 0) {
      matches.set(full.route.url, freezeNeed(full, fullIsSafety ? -1 : clauses.length + 1));
    }
  }

  const ranked = Object.freeze([...matches.values()].sort(sortNeeds));
  const primary = ranked[0] ?? null;
  const secondary = Object.freeze(ranked.slice(1));
  const unresolved = dedupeContexts(unresolvedSafetyContexts);
  const hasSafetyCriticalNeed = ranked.some((need) => need.safety_level === 'P0' || need.safety_level === 'P1');
  const needsClarification = unresolved.length > 0 || ranked.length === 0;

  return Object.freeze({
    version: 1,
    matched: ranked.length > 0,
    multiple_needs: ranked.length > 1,
    needs_clarification: needsClarification,
    primary_need: primary,
    secondary_needs: secondary,
    relevant_needs: ranked,
    unresolved_safety_contexts: unresolved,
    safety_first: true,
    auto_navigate: false,
    suppress_commercial_ui: hasSafetyCriticalNeed || unresolved.length > 0,
    raw_query_retained: false,
    diagnostic: false,
    automated_clinical_decision: false
  });
}

export function multipleNeedsCapabilities() {
  return Object.freeze({
    version: 1,
    max_candidate_clauses: 12,
    safety_first: true,
    ranks_multiple_needs: true,
    retains_raw_query: false,
    auto_navigation: false,
    commercial_ui_allowed_during_unresolved_safety: false
  });
}
