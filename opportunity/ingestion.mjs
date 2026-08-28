import { attachCandidateId } from './candidate-resolver.mjs';

const SAFE_ID = /^[a-z0-9][a-z0-9-_]{1,120}$/i;
const SAFE_PATH = /^\/[a-z0-9\-_/]*\/$/i;

export const INGESTION_SOURCES = Object.freeze({
  SEARCH_CONSOLE: 'search_console',
  ANALYTICS: 'analytics',
  CONVERSIONS: 'conversion_tracking',
  PARTNER: 'partner_report'
});

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function isoDate(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) throw new Error('Invalid observedAt');
  return d.toISOString();
}

function validateCandidateId(candidateId) {
  if (!SAFE_ID.test(String(candidateId || ''))) throw new Error('Invalid candidateId');
}

function validatePath(path) {
  if (!SAFE_PATH.test(String(path || ''))) throw new Error('Invalid page path');
}

function resolveRowIdentity(row = {}) {
  if (row.candidateId && row.path) return row;
  return attachCandidateId(row);
}

export function normalizeSearchConsoleRow(row = {}) {
  const identified = resolveRowIdentity(row);
  validateCandidateId(identified.candidateId);
  validatePath(identified.path);
  return Object.freeze({
    source: INGESTION_SOURCES.SEARCH_CONSOLE,
    candidateId: String(identified.candidateId),
    path: String(identified.path),
    observedAt: isoDate(identified.observedAt),
    resolution: identified.resolution,
    metrics: Object.freeze({
      impressions: Math.max(0, asNumber(identified.impressions)),
      clicks: Math.max(0, asNumber(identified.clicks)),
      position: Math.max(1, asNumber(identified.position, 100))
    })
  });
}

export function normalizeAnalyticsRow(row = {}) {
  const identified = resolveRowIdentity(row);
  validateCandidateId(identified.candidateId);
  validatePath(identified.path);
  return Object.freeze({
    source: INGESTION_SOURCES.ANALYTICS,
    candidateId: String(identified.candidateId),
    path: String(identified.path),
    observedAt: isoDate(identified.observedAt),
    resolution: identified.resolution,
    metrics: Object.freeze({
      sessions: Math.max(0, asNumber(identified.sessions)),
      engagedSessions: Math.max(0, asNumber(identified.engagedSessions)),
      outboundClicks: Math.max(0, asNumber(identified.outboundClicks))
    })
  });
}

export function normalizeConversionRow(row = {}) {
  const identified = resolveRowIdentity(row);
  validateCandidateId(identified.candidateId);
  validatePath(identified.path);
  return Object.freeze({
    source: INGESTION_SOURCES.CONVERSIONS,
    candidateId: String(identified.candidateId),
    path: String(identified.path),
    observedAt: isoDate(identified.observedAt),
    resolution: identified.resolution,
    metrics: Object.freeze({
      leads: Math.max(0, asNumber(identified.leads)),
      conversions: Math.max(0, asNumber(identified.conversions)),
      revenue: Math.max(0, asNumber(identified.revenue)),
      sessions: Math.max(0, asNumber(identified.sessions))
    })
  });
}

export function makeRecordKey(record) {
  return [record.source, record.candidateId, record.path, record.observedAt.slice(0, 10)].join('|');
}

export function dedupeRecords(records = []) {
  const map = new Map();
  for (const record of records) map.set(makeRecordKey(record), record);
  return [...map.values()];
}

function sumMetric(records, name) {
  return records.reduce((sum, r) => sum + asNumber(r.metrics?.[name]), 0);
}

export function buildEvidenceSnapshot(records = []) {
  const clean = dedupeRecords(records);
  const grouped = new Map();
  for (const record of clean) {
    if (!grouped.has(record.candidateId)) grouped.set(record.candidateId, []);
    grouped.get(record.candidateId).push(record);
  }

  const snapshot = {};
  for (const [candidateId, rows] of grouped.entries()) {
    const sc = rows.filter(r => r.source === INGESTION_SOURCES.SEARCH_CONSOLE);
    const analytics = rows.filter(r => r.source === INGESTION_SOURCES.ANALYTICS);
    const conversions = rows.filter(r => r.source === INGESTION_SOURCES.CONVERSIONS);
    const seo = sc.length ? {
      source: INGESTION_SOURCES.SEARCH_CONSOLE,
      impressions: sumMetric(sc, 'impressions'),
      clicks: sumMetric(sc, 'clicks'),
      position: Number((sc.reduce((s, r) => s + asNumber(r.metrics.position, 100), 0) / sc.length).toFixed(2))
    } : undefined;

    const sessions = sumMetric(analytics, 'sessions') || sumMetric(conversions, 'sessions');
    const commercial = conversions.length ? {
      source: INGESTION_SOURCES.CONVERSIONS,
      leads: sumMetric(conversions, 'leads'),
      conversions: sumMetric(conversions, 'conversions'),
      revenue: Number(sumMetric(conversions, 'revenue').toFixed(2)),
      sessions
    } : undefined;

    snapshot[candidateId] = Object.freeze({
      seo,
      commercial,
      analytics: analytics.length ? Object.freeze({
        source: INGESTION_SOURCES.ANALYTICS,
        sessions: sumMetric(analytics, 'sessions'),
        engagedSessions: sumMetric(analytics, 'engagedSessions'),
        outboundClicks: sumMetric(analytics, 'outboundClicks')
      }) : undefined,
      provenance: Object.freeze({
        records: rows.length,
        sources: [...new Set(rows.map(r => r.source))].sort(),
        resolutionMethods: [...new Set(rows.map(r => r.resolution?.method).filter(Boolean))].sort()
      })
    });
  }
  return Object.freeze(snapshot);
}

export function rejectSensitiveFields(row = {}) {
  const forbidden = ['name','email','phone','dni','address','story','storyText','message','ip','userId'];
  const found = forbidden.filter(key => row[key] !== undefined);
  if (found.length) throw new Error(`Sensitive fields are not allowed in ingestion: ${found.join(',')}`);
  return true;
}

export function ingestBatch(source, rows = []) {
  const normalizer = source === INGESTION_SOURCES.SEARCH_CONSOLE ? normalizeSearchConsoleRow
    : source === INGESTION_SOURCES.ANALYTICS ? normalizeAnalyticsRow
    : source === INGESTION_SOURCES.CONVERSIONS ? normalizeConversionRow
    : null;
  if (!normalizer) throw new Error(`Unsupported ingestion source: ${source}`);
  return rows.map(row => { rejectSensitiveFields(row); return normalizer(row); });
}
