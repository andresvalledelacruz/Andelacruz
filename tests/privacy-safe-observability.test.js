import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOperationalEvent,
  containsForbiddenObservabilityFields,
  durationBucket,
  normalizeRouteTemplate,
  outcomeFromStatus
} from '../src/privacy-safe-observability.js';

test('operational event never includes payload, identity, network or auth fields', () => {
  const event = buildOperationalEvent({
    service: 'desgracias-api',
    requestId: 'req-123',
    method: 'POST',
    route: '/api/stories/:storyId/updates?author_secret=never-log-this',
    statusCode: 202,
    durationMs: 243
  });

  assert.equal(event.route, '/api/stories/:storyId/updates');
  assert.equal(event.outcome, 'success');
  assert.equal(event.duration_bucket, '100_499ms');
  assert.equal(event.privacy_mode, 'no_pii_no_payload');
  assert.equal(containsForbiddenObservabilityFields(event), false);
  assert.equal(JSON.stringify(event).includes('never-log-this'), false);
});

test('route normalization strips query strings and fragments', () => {
  assert.equal(normalizeRouteTemplate('/historias?email=a@example.com#x'), '/historias');
  assert.equal(normalizeRouteTemplate('not-a-route'), 'unknown');
});

test('duration buckets avoid high-cardinality raw timing values', () => {
  assert.equal(durationBucket(20), 'lt_100ms');
  assert.equal(durationBucket(250), '100_499ms');
  assert.equal(durationBucket(700), '500_999ms');
  assert.equal(durationBucket(1500), '1_2s');
  assert.equal(durationBucket(4000), 'gte_3s');
});

test('status outcomes are coarse and operational', () => {
  assert.equal(outcomeFromStatus(204), 'success');
  assert.equal(outcomeFromStatus(302), 'redirect');
  assert.equal(outcomeFromStatus(429), 'client_error');
  assert.equal(outcomeFromStatus(503), 'server_error');
});

test('free-form error text is rejected; only bounded error codes are accepted', () => {
  const rejected = buildOperationalEvent({
    statusCode: 500,
    errorCode: 'Database failed for user maria@example.com because token=abc'
  });
  const accepted = buildOperationalEvent({
    statusCode: 503,
    errorCode: 'queue_unavailable'
  });

  assert.equal(rejected.error_code, null);
  assert.equal(accepted.error_code, 'queue_unavailable');
});
