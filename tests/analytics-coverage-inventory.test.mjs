import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readCriticalRoutes, routeToFile } from '../scripts/lib/p0-p1-resource-policy.mjs';

test('coverage inventory separates explicit no-measurement contracts and critical review', async () => {
  const report = JSON.parse(execFileSync(process.execPath, ['scripts/analytics-coverage-inventory.mjs'], { encoding: 'utf8' }));
  const byFile = new Map(report.pages.map(row => [row.file, row]));
  const statuses = ['covered', 'explicitly_unmeasured', 'safety_review', 'review_needed'];
  assert.equal(report.indexable_html, statuses.reduce((sum, status) => sum + report.breakdown[status], 0));
  assert.equal(report.missing, report.indexable_html - report.covered);
  assert.equal(report.covered, report.breakdown.covered);

  for (const file of ['recursos/index.html', 'internacional.html', ...['es', 'en', 'fr', 'pt'].map(lang => `ayuda/${lang}/index.html`)]) {
    assert.equal(byFile.get(file)?.status, 'explicitly_unmeasured', file);
  }
  for (const route of await readCriticalRoutes()) {
    const row = byFile.get(routeToFile(route));
    if (row && row.analytics === 'no') assert.notEqual(row.status, 'review_needed', route);
  }
});
