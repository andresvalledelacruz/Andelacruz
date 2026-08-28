function iso(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) throw new Error('Invalid snapshot timestamp');
  return d.toISOString();
}

export function createRankingSnapshot(ranking = [], options = {}) {
  const createdAt = iso(options.createdAt);
  const id = options.id || `ranking-${createdAt}`;
  const items = ranking.map(item => Object.freeze({
    rank: item.rank,
    id: item.id,
    slug: item.slug,
    title: item.title,
    domain: item.domain,
    score: item.score,
    confidence: item.confidence,
    risk: item.risk,
    evidenceCoverage: item.evidence?.resolution?.evidenceCoverage ?? 0
  }));
  return Object.freeze({ id, createdAt, modelVersion: options.modelVersion || 'opportunity-scoring-v1', items: Object.freeze(items) });
}

export function compareSnapshots(previous, current) {
  const prev = new Map((previous?.items || []).map(i => [i.id, i]));
  return Object.freeze((current?.items || []).map(item => {
    const old = prev.get(item.id);
    return Object.freeze({
      id: item.id,
      title: item.title,
      currentRank: item.rank,
      previousRank: old?.rank ?? null,
      rankDelta: old ? old.rank - item.rank : null,
      currentScore: item.score,
      previousScore: old?.score ?? null,
      scoreDelta: old ? Number((item.score - old.score).toFixed(2)) : null,
      confidenceDelta: old ? Number((item.confidence - old.confidence).toFixed(2)) : null,
      evidenceCoverageDelta: old ? Number((item.evidenceCoverage - old.evidenceCoverage).toFixed(2)) : null,
      isNew: !old
    });
  }));
}

export function detectMovers(previous, current, options = {}) {
  const { minRankDelta = 3, minScoreDelta = 5 } = options;
  return compareSnapshots(previous, current)
    .filter(item => item.isNew || Math.abs(item.rankDelta || 0) >= minRankDelta || Math.abs(item.scoreDelta || 0) >= minScoreDelta)
    .sort((a, b) => Math.abs(b.rankDelta || 0) - Math.abs(a.rankDelta || 0) || Math.abs(b.scoreDelta || 0) - Math.abs(a.scoreDelta || 0));
}

export function snapshotHistorySummary(snapshots = []) {
  const ordered = [...snapshots].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (!ordered.length) return Object.freeze({ count: 0, first: null, latest: null, topChanges: [] });
  const latest = ordered.at(-1);
  const previous = ordered.length > 1 ? ordered.at(-2) : null;
  return Object.freeze({ count: ordered.length, first: ordered[0].createdAt, latest: latest.createdAt, topChanges: previous ? detectMovers(previous, latest).slice(0, 10) : [] });
}
