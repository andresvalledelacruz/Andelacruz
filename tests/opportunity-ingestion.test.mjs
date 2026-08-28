import test from 'node:test';
import assert from 'node:assert/strict';
import { INGESTION_SOURCES, buildEvidenceSnapshot, ingestBatch, normalizeSearchConsoleRow, rejectSensitiveFields } from '../opportunity/ingestion.mjs';

test('normalizes search console rows', () => {
  const row = normalizeSearchConsoleRow({ candidateId:'work-change-job', path:'/trabajo/quiero-cambiar-de-trabajo-pero-no-se-a-que/', impressions:1000, clicks:100, position:7, observedAt:'2026-08-28' });
  assert.equal(row.source, INGESTION_SOURCES.SEARCH_CONSOLE);
  assert.equal(row.metrics.clicks, 100);
});

test('auto-resolves candidate id from a full URL', () => {
  const [row] = ingestBatch(INGESTION_SOURCES.SEARCH_CONSOLE, [{ url:'https://desgracias.es/trabajo/quiero-cambiar-de-trabajo-pero-no-se-a-que/?utm_source=test', impressions:1000, clicks:100, position:7, observedAt:'2026-08-28' }]);
  assert.equal(row.candidateId, 'work-change-job');
  assert.equal(row.path, '/trabajo/quiero-cambiar-de-trabajo-pero-no-se-a-que/');
  assert.equal(row.resolution.method, 'exact_path');
});

test('rejects direct sensitive fields', () => {
  assert.throws(() => rejectSensitiveFields({ candidateId:'x', email:'a@b.com' }), /Sensitive fields/);
});

test('builds evidence snapshot from multiple sources', () => {
  const sc = ingestBatch(INGESTION_SOURCES.SEARCH_CONSOLE, [{candidateId:'work-change-job',path:'/trabajo/quiero-cambiar-de-trabajo-pero-no-se-a-que/',impressions:1000,clicks:100,position:6,observedAt:'2026-08-28'}]);
  const ga = ingestBatch(INGESTION_SOURCES.ANALYTICS, [{candidateId:'work-change-job',path:'/trabajo/quiero-cambiar-de-trabajo-pero-no-se-a-que/',sessions:500,engagedSessions:300,outboundClicks:40,observedAt:'2026-08-28'}]);
  const cv = ingestBatch(INGESTION_SOURCES.CONVERSIONS, [{candidateId:'work-change-job',path:'/trabajo/quiero-cambiar-de-trabajo-pero-no-se-a-que/',leads:20,conversions:5,revenue:300,sessions:500,observedAt:'2026-08-28'}]);
  const snapshot = buildEvidenceSnapshot([...sc,...ga,...cv]);
  assert.equal(snapshot['work-change-job'].seo.impressions, 1000);
  assert.equal(snapshot['work-change-job'].commercial.conversions, 5);
  assert.deepEqual(snapshot['work-change-job'].provenance.sources, ['analytics','conversion_tracking','search_console']);
});
