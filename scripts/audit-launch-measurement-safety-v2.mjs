#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditLaunchMeasurementSafety as auditV1 } from './audit-launch-measurement-safety.mjs';

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// 2026-09-17: reviewed full-card urgent navigation and local resource directory.
// The directory adds only DOM navigation/filtering, with no query, storage or network API.
const APPROVED_APP_SHA256 = 'c5febb8f368d13f89f01a9b38b626b0b160c3785ef7a629324dae08c8d190306';
const APPROVED_HOME_CLOSURE = [
  'app-core.js',
  'app.js',
  'next-step-adapter.js',
  'next-step-guidance.js',
  'resource-directory.js',
  'story-example-library.js',
  'visitor-analytics.js',
].sort();
const INTENTIONAL_V1_DRIFT = new Set([
  'pinned measurement file changed: app.js',
  'homepage dependency set changed',
]);

export async function auditLaunchMeasurementSafety(options = {}) {
  const root = options.root ?? DEFAULT_ROOT;
  const rootReal = await realpath(root);
  const report = await auditV1({ ...options, root: rootReal });
  const failures = report.hard_failures.filter((failure) => !INTENTIONAL_V1_DRIFT.has(failure));

  const appSource = await readFile(path.join(rootReal, 'app.js'));
  const appSha256 = createHash('sha256').update(appSource).digest('hex');
  if (appSha256 !== APPROVED_APP_SHA256) {
    failures.push('pinned measurement file changed: app.js (v2 approved runtime hash mismatch)');
  }

  const actualClosure = [...report.homepage_dependency_files].sort();
  if (JSON.stringify(actualClosure) !== JSON.stringify(APPROVED_HOME_CLOSURE)) {
    failures.push('homepage dependency set changed (v2 approved static-critical closure mismatch)');
  }

  for (const legacy of ['resource-links.js', 'search-home-entry.js', 'urgent-help-nav.js']) {
    if (actualClosure.includes(legacy)) failures.push(`legacy DOM injector re-entered homepage dependency graph: ${legacy}`);
  }

  const uniqueFailures = [...new Set(failures)].sort();
  return {
    ...report,
    decision: uniqueFailures.length ? 'HOLD' : 'MEASUREMENT_GO_WITH_SELECTIVE_EXPANSION',
    hard_failures: uniqueFailures,
    measurement_gate_version: 2,
    approved_app_sha256: APPROVED_APP_SHA256,
    approved_home_closure: APPROVED_HOME_CLOSURE,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await auditLaunchMeasurementSafety();
  console.log(JSON.stringify(report, null, 2));
  if (report.hard_failures.length) process.exitCode = 1;
}
