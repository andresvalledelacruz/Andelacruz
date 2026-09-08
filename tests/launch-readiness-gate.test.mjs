import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('launch readiness gate has no hard failures on the release tree', () => {
  const result = spawnSync(process.execPath, ['scripts/audit-launch-readiness.mjs'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.hard_failures, 0, JSON.stringify(report.errors));
  assert.equal(report.decision, 'TECHNICAL_GO_WITH_MANUAL_HOLDS');
  assert.ok(report.checks.some((check) => check.name === 'canonical-integrity' && check.status === 'PASS'));
  assert.ok(report.checks.some((check) => check.name === 'search-discoverability' && check.status === 'PASS'));
  assert.ok(report.checks.some((check) => check.name === 'search-content-coverage' && check.status === 'PASS'));
});

test('manual launch holds remain explicit rather than silently green', () => {
  const result = spawnSync(process.execPath, ['scripts/audit-launch-readiness.mjs'], {
    cwd: root,
    encoding: 'utf8'
  });
  const report = JSON.parse(result.stdout);
  assert.ok(report.manual_holds >= 1);
  assert.ok(report.warnings.some((warning) => warning.includes('asset-provenance')));
});
