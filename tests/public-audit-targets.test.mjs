import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
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

test('target parsing accepts formatted XML and rejects empty or foreign sitemaps', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'public-audit-targets-'));
  try {
    fs.writeFileSync(path.join(fixture, 'SAFETY_ROUTE_INVENTORY.md'), '| `/ayuda-urgente.html` | safety | no commerce |\n');
    fs.writeFileSync(path.join(fixture, 'sitemap.xml'), '<urlset><url><loc>\n https://desgracias.es/ \n</loc></url></urlset>');
    assert.deepEqual(publicAuditUrls(fixture), [
      'https://desgracias.es/',
      'https://desgracias.es/ayuda-urgente.html',
      'https://desgracias.es/buscar/'
    ]);

    fs.writeFileSync(path.join(fixture, 'sitemap.xml'), '<urlset></urlset>');
    assert.throws(() => publicAuditUrls(fixture), /Sitemap is empty/);
    fs.writeFileSync(path.join(fixture, 'sitemap.xml'), '<urlset><url><loc>https://example.com/</loc></url></urlset>');
    assert.throws(() => publicAuditUrls(fixture), /Unexpected sitemap origin/);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test('auditors resolve HTML from the requested root instead of the checkout root', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'public-audit-root-'));
  try {
    fs.mkdirSync(path.join(fixture, 'buscar'), { recursive: true });
    fs.writeFileSync(path.join(fixture, 'sitemap.xml'), '<urlset><url><loc>https://desgracias.es/</loc></url></urlset>');
    fs.writeFileSync(path.join(fixture, 'SAFETY_ROUTE_INVENTORY.md'), '| `/ayuda-urgente.html` | fixture | fixture |\n');
    fs.writeFileSync(path.join(fixture, 'index.html'), '<html lang="es"><head><meta name="viewport" content="width=device-width"></head><body><main><h1>Fixture</h1></main></body></html>');
    fs.writeFileSync(path.join(fixture, 'ayuda-urgente.html'), '<html lang="es"><head><meta name="viewport" content="width=device-width"></head><body><main><h1>Fixture</h1></main></body></html>');
    fs.writeFileSync(path.join(fixture, 'buscar', 'index.html'), '<html lang="es"><head><meta name="viewport" content="width=device-width"></head><body><main></main></body></html>');

    const accessibility = auditSitemap(fixture);
    assert.ok(accessibility.errors.some((error) => error.includes('/buscar/') && error.includes('<h1>')));
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
