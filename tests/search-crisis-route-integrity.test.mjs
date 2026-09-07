import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { searchRouteCatalog } from '../src/search-crisis-router.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function localTargetFor(url) {
  assert.match(url, /^\/[a-z0-9][a-z0-9\-/]*?(?:\.html|\/)$/i, `Search route must be a local deployable URL: ${url}`);
  assert.notEqual(url, '/', 'Search routes must never fall back to the homepage');
  const clean = url.replace(/^\//, '');
  return url.endsWith('/') ? path.join(repoRoot, clean, 'index.html') : path.join(repoRoot, clean);
}

test('every search route points to an existing deployable target', async () => {
  const catalog = searchRouteCatalog();
  assert.ok(catalog.length > 0, 'Search catalog must not be empty');

  for (const route of catalog) {
    const target = localTargetFor(route.url);
    await assert.doesNotReject(
      () => access(target),
      `Broken search target for ${route.intent}: ${route.url}`
    );
  }
});

test('search route URLs are unique and intents are unique', () => {
  const catalog = searchRouteCatalog();
  const urls = catalog.map((route) => route.url);
  const intents = catalog.map((route) => route.intent);
  assert.equal(new Set(urls).size, urls.length, 'Two search intents must not silently compete for the same URL');
  assert.equal(new Set(intents).size, intents.length, 'Search intent identifiers must be unique');
});

test('P0/P1 catalog entries cannot be marked as non-safety by mistake', () => {
  const catalog = searchRouteCatalog();
  const critical = catalog.filter((route) => route.safety_level === 'P0' || route.safety_level === 'P1');
  assert.ok(critical.length > 0, 'Critical search routes must remain represented');
  assert.ok(critical.every((route) => route.url && route.label), 'Critical search routes need explicit destinations and labels');
});
