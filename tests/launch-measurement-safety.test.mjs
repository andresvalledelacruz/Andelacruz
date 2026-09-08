import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('launch measurement gate keeps P0/P1 and search outside page analytics', () => {
  const result = spawnSync(process.execPath, ['scripts/audit-launch-measurement-safety.mjs'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.hard_failures, 0, JSON.stringify(report.errors));
  assert.equal(report.decision, 'MEASUREMENT_GO_WITH_SELECTIVE_EXPANSION');
  assert.ok(report.safety_routes >= 7);
  assert.ok(report.ordinary_covered >= 10);

  const failedSafety = report.checks.filter((check) => check.name.startsWith('no-page-analytics:') && check.status !== 'PASS');
  assert.deepEqual(failedSafety, []);
  assert.ok(report.checks.some((check) => check.name === 'search-no-page-analytics' && check.status === 'PASS'));
  assert.ok(report.checks.some((check) => check.name === 'analytics-no-credentials' && check.status === 'PASS'));
  assert.ok(report.checks.some((check) => check.name === 'analytics-no-cookie-storage' && check.status === 'PASS'));
});

test('ordinary measurement gaps remain explicit and non-blocking', () => {
  const result = spawnSync(process.execPath, ['scripts/audit-launch-measurement-safety.mjs'], {
    cwd: root,
    encoding: 'utf8'
  });
  const report = JSON.parse(result.stdout);
  assert.ok(report.ordinary_indexable_routes >= report.ordinary_covered);
  if (report.ordinary_missing > 0) {
    assert.ok(report.warnings.some((warning) => warning.includes('ordinary-measurement-coverage')));
  }
});
