import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const page = readFileSync('webs-amigas.html', 'utf8');
test('national directory has dated official sources and useful static entries without partnerships', () => {
  const cards = [...page.matchAll(/<article\b[^>]*data-organization="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)];
  assert.equal(cards.length, 5);
  const domains = new Set(['www.anar.org', 'www.caritas.es', 'www.contraelcancer.es', 'inclusion.enfermedades-raras.org', 'www.cear.es']);
  for (const [, id, html] of cards) {
    assert.match(html, /<h2>[^<]+<\/h2>/);
    assert.match(html, /Fuente oficial consultada: <time datetime="2026-09-17">/);
    const url = new URL(html.match(/href="(https:[^"]+)"/)[1]);
    assert.ok(domains.delete(url.hostname), `${id} must have its own official source`);
    assert.match(html, /rel="noreferrer"/);
  }
  assert.equal(domains.size, 0);
  assert.match(page, /no implica colaboración, patrocinio ni acuerdo/);
  assert.ok(page.indexOf('href="tel:112"') < page.indexOf('data-organization='));
  assert.doesNotMatch(page, /<form|<input|<script[^>]+src=/);
  for (const [, href] of page.matchAll(/href="(\/[^"#]*)"/g)) {
    assert.ok(existsSync(`.${href}${href.endsWith('/') ? 'index.html' : ''}`), href);
  }
});
test('the substantive directory is indexable with canonical metadata and sitemap inclusion', () => {
  assert.match(page, /name="robots" content="index,follow/);
  assert.match(page, /rel="canonical" href="https:\/\/desgracias.es\/webs-amigas.html"/);
  assert.equal((page.match(/<h1>/g) || []).length, 1);
  const ld = JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(ld['@type'], 'CollectionPage');
  assert.match(readFileSync('sitemap.xml', 'utf8'), /<loc>https:\/\/desgracias.es\/webs-amigas.html<\/loc>/);
});
