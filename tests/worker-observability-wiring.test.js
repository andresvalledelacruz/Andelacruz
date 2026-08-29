import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/worker.js', import.meta.url), 'utf8');

test('worker emits only bucketed privacy-safe queue telemetry', () => {
  assert.match(source, /event: 'queue_health'/);
  assert.match(source, /privacy_mode: 'no_pii_no_payload'/);
  assert.match(source, /visible_bucket/);
  assert.match(source, /total_bucket/);
  assert.match(source, /oldest_age_bucket/);

  assert.doesNotMatch(source, /console\.log\('\[worker\] queue metrics'/);
  assert.doesNotMatch(source, /error\.message/);
  assert.doesNotMatch(source, /JSON\.stringify\(rows\[0\]/);
});

test('worker readiness never exposes connection configuration', () => {
  assert.match(source, /database: 'unconfigured'/);
  assert.doesNotMatch(source, /console\.(?:log|error)\([^\n]*DATABASE_URL/);
  assert.doesNotMatch(source, /connectionString[^\n]*console/);
});
