import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicAuditUrls } from '../scripts/public-audit-targets.mjs';
import { auditSitemap } from '../scripts/audit-accessibility.mjs';
import { auditPerformance } from '../scripts/audit-performance-budget.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('public auditors include sitemap, Safety inventory and isolated search route', () => {
  const urls = publicAuditUrls(root);
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const inventory = fs.readFileSync(path.join(root, 'SAFETY_ROUTE_INVENTORY.md'), 'utf8');
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const safetyUrls = [...inventory.matchAll(/^\|\s*`(\/[^`]+)`\s*\|/gm)]
    .map((match) => new URL(match[1], 'https://desgracias.es').href);

  assert.equal(new Set(urls).size, urls.length, 'audit targets must be unique');
  for (const url of [...sitemapUrls, ...safetyUrls, 'https://desgracias.es/buscar/']) {
    assert.ok(urls.includes(url), `${url} missing from public audit targets`);
  }
  assert.ok(urls.length > sitemapUrls.length, 'critical non-sitemap routes must expand coverage');
});

test('accessibility and performance consume the same expanded public target set', () => {
  const targets = publicAuditUrls(root);
  assert.deepEqual(auditSitemap(root).urls, targets);
  assert.deepEqual(auditPerformance(root).urls, targets);
});
