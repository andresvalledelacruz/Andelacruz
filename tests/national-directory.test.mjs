import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const page = readFileSync('webs-amigas.html', 'utf8');
const runtime = readFileSync('webs-amigas-country-filter.js', 'utf8');
const directory = JSON.parse(readFileSync('data/help-directory.json','utf8'));

test('national directory has dated verified sources and a country-first runtime without implied partnerships', () => {
  const records=directory.records;
  assert.equal(records.length,200);
  assert.equal(new Set(records.map(r=>r.id)).size,200);
  assert.equal(new Set(records.map(r=>r.url)).size,200);
  for(const record of records){
    assert.ok(record.id);
    assert.ok(record.name);
    assert.ok(record.description);
    assert.ok(directory.categories[record.category]);
    assert.ok(directory.countries[record.country]);
    assert.equal(new URL(record.url).protocol,'https:');
    assert.equal(record.sourceUrl,record.url);
    assert.match(record.reviewedAt,/^2026-09-(18|20)$/);
    assert.ok(record.description.length<110);
  }
  assert.match(page, /no implica colaboración, patrocinio ni acuerdo/);
  assert.ok(page.indexOf('href="tel:112"') < page.indexOf('id="friends-groups"'));
  assert.match(page,/id="country-buttons"/);
  assert.match(page,/id="friends-groups"/);
  assert.match(page,/src="\/webs-amigas-country-filter\.js"/);
  assert.match(runtime,/fetch\('\/data\/help-directory\.json'/);
  assert.match(runtime,/renderCountry\('ES'\)/);
  assert.match(runtime,/record\.country === code/);
  assert.ok(page.includes('href="/internacional.html"'));
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
