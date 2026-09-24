import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const page = readFileSync('webs-amigas.html', 'utf8');
test('national directory has dated official sources and useful static entries without partnerships', () => {
  const records=JSON.parse(readFileSync('data/help-directory.json','utf8')).records;
  const cards=[...page.matchAll(/<a\b[^>]*data-organization="([^"]+)"[^>]*>[\s\S]*?<\/a>/g)];
  assert.equal(cards.length,200);
  assert.equal(records.length,200);
  assert.equal(new Set(records.map(r=>r.id)).size,200);
  assert.equal(new Set(records.map(r=>r.url)).size,200);
  for(const [html,id] of cards){
    const record=records.find(r=>r.id===id);
    assert.ok(record,id);
    assert.match(html,/<h3\b[^>]*>[^<]+<\/h3>/);
    assert.ok(html.includes(record.description));
    assert.ok(html.includes('href="'+record.url+'"'));
    assert.equal(new URL(record.url).protocol,'https:');
    assert.equal(record.sourceUrl,record.url);
    assert.match(record.reviewedAt,/^2026-09-(18|20)$/);
    assert.ok(record.description.length<110);
    assert.equal((html.match(/<a\b/g)||[]).length,1);
    assert.match(html,/rel="noreferrer"/);
  }
  assert.match(page,/<time datetime="2026-09-20">/);
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
