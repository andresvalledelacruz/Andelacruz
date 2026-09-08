import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('launch smoke covers the critical public journey with zero hard failures', () => {
  const result = spawnSync(process.execPath, ['scripts/audit-launch-smoke.mjs'], {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.decision, 'SMOKE_GO');
  assert.equal(report.hard_failures, 0, JSON.stringify(report.errors));

  const required = [
    'launch-readiness-gate',
    'homepage-search-main-nav',
    'homepage-search-hero',
    'homepage-search-needs',
    'search-clarification',
    'story-submit-wiring',
    'urgent-help-resources',
    '404-recovery'
  ];
  const passed = new Set(report.checks.filter((check) => check.status === 'PASS').map((check) => check.name));
  for (const name of required) assert.equal(passed.has(name), true, `${name} must pass`);
});
