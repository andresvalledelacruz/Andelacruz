import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeAcquisition, formatAcquisition } from '../scripts/lib/private-acquisition.mjs';

const row = (day, host, pageviews) => ({ day, path: '/', referrer_host: host, device_class: 'desktop', country_code: 'ES', pageviews });
const snapshot = {
  generated_at: '2026-09-19T12:00:00Z', timezone: 'UTC',
  rows: [row('2026-09-19', 'google.com', 3), row('2026-09-19', 'internal', 4), row('2026-09-18', 'direct', 2), row('2026-09-18', 'unknown', 1), row('2026-09-12', 'example.org', 20)],
};

test('separates external referrals from internal, direct and unknown without inventing sessions', () => {
  const result = summarizeAcquisition(snapshot, 7);
  assert.equal(result.total, 10);
  assert.equal(result.daysWithData, 2);
  assert.deepEqual([result.external, result.internal, result.direct, result.unknown], [3, 4, 2, 1]);
  assert.deepEqual(result.externalHosts, [['google.com', 3]]);
  assert.match(formatAcquisition(result), /Total: 10 páginas vistas \(no personas ni sesiones\)/);
  assert.match(formatAcquisition(result), /Referencia externa: 3 \(30 %\)/);
  assert.equal(summarizeAcquisition(snapshot, 30).external, 23);
  assert.throws(() => summarizeAcquisition(snapshot, 0));
});

test('empty export does not divide by zero or disclose unexpected fields', () => {
  const result = summarizeAcquisition({...snapshot, rows: [], private_note: 'do not print'});
  const text = formatAcquisition(result);
  assert.match(text, /No calculable/);
  assert.doesNotMatch(text, /do not print/);
  assert.throws(() => summarizeAcquisition({...snapshot, rows: [row('2026-09-19', '<unsafe>', 1)]}));
});
