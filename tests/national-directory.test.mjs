import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const page = readFileSync('webs-amigas.html', 'utf8');
const directory = JSON.parse(readFileSync('data/help-directory.json','utf8'));

test('Spanish organizations directory is static, sourced and separate from country resources', () => {
  const records=directory.records;
  assert.equal(records.length,212);
  assert.equal(new Set(records.map(r=>r.id)).size,212);
  assert.equal(new Set(records.map(r=>r.url)).size,212);
  for(const record of records){
    assert.ok(record.id);
    assert.ok(record.name);
    assert.ok(record.description);
    assert.ok(directory.categories[record.category]);
    assert.ok(directory.countries[record.country]);
    assert.equal(new URL(record.url).protocol,'https:');
    assert.equal(record.sourceUrl,record.url);
    assert.match(record.reviewedAt,/^2026-09-(18|20|27)$/);
    assert.ok(record.description.length<110);
  }
  assert.match(page, /no implica colaboración, patrocinio ni acuerdo/);
  assert.ok(page.indexOf('href="/ayuda-urgente.html"') < page.indexOf('data-organization="'));
  assert.doesNotMatch(page,/id="country-buttons"|webs-amigas-country-filter|Webs amigas por país/);
  assert.ok(page.includes('href="/recursos/"'));
  assert.equal((page.match(/data-organization=/g)||[]).length,50);
  for(const record of records.filter(r=>r.kind==='organization')){
    assert.ok(page.includes(`data-organization="${record.id}"`),record.id);
    assert.ok(page.includes(`href="${record.url}"`),record.id);
  }
  for(const record of records.filter(r=>r.kind==='resource'))assert.ok(!page.includes(`href="${record.url}"`),record.id);
  for (const [, href] of page.matchAll(/href="(\/[^"#]*)"/g)) {
    const pathname = href.split('?')[0];
    assert.ok(existsSync(`.${pathname}${pathname.endsWith('/') ? 'index.html' : ''}`), href);
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
