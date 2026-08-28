import { CANDIDATE_PAGES } from './candidate-pages.mjs';

const byId = new Map(CANDIDATE_PAGES.map(c => [c.id, c]));
const bySlug = new Map(CANDIDATE_PAGES.map(c => [c.slug, c]));

function normalizePath(input = '') {
  try {
    if (/^https?:\/\//i.test(input)) return new URL(input).pathname.replace(/\/+/g, '/').replace(/([^/])$/, '$1/');
  } catch {}
  const path = String(input || '').split('?')[0].split('#')[0].replace(/\/+/g, '/');
  if (!path.startsWith('/')) return `/${path}`.replace(/([^/])$/, '$1/');
  return path.replace(/([^/])$/, '$1/');
}

export function resolveCandidate(input = {}) {
  const explicitId = String(input.candidateId || '');
  if (explicitId && byId.has(explicitId)) return Object.freeze({ candidate: byId.get(explicitId), method: 'candidate_id', confidence: 1 });

  const path = normalizePath(input.path || input.url || '');
  if (path && bySlug.has(path)) return Object.freeze({ candidate: bySlug.get(path), method: 'exact_path', confidence: 1 });

  if (path) {
    const normalized = path.toLowerCase();
    let best = null;
    for (const candidate of CANDIDATE_PAGES) {
      const candidateTokens = candidate.slug.toLowerCase().split(/[-/]+/).filter(t => t.length > 3);
      const hits = candidateTokens.filter(t => normalized.includes(t)).length;
      const score = candidateTokens.length ? hits / candidateTokens.length : 0;
      if (!best || score > best.score) best = { candidate, score };
    }
    if (best && best.score >= 0.6) return Object.freeze({ candidate: best.candidate, method: 'path_similarity', confidence: Number(best.score.toFixed(2)) });
  }

  return Object.freeze({ candidate: null, method: 'unresolved', confidence: 0 });
}

export function attachCandidateId(row = {}) {
  const resolved = resolveCandidate(row);
  if (!resolved.candidate) throw new Error(`Unable to resolve candidate for ${row.path || row.url || 'record'}`);
  return Object.freeze({ ...row, candidateId: resolved.candidate.id, path: resolved.candidate.slug, resolution: Object.freeze({ method: resolved.method, confidence: resolved.confidence }) });
}

export function resolverCoverage(rows = []) {
  const results = rows.map(resolveCandidate);
  const resolved = results.filter(r => r.candidate).length;
  return Object.freeze({ total: rows.length, resolved, unresolved: rows.length - resolved, coverage: rows.length ? Number((resolved / rows.length).toFixed(3)) : 1 });
}
