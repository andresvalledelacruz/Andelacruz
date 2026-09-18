import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync('data/international-entrypoints.json','utf8'));
const html=readFileSync('internacional.html','utf8');
test('seven international destinations preserve their order and regional scope',()=>{
  assert.deepEqual(data.countries.map(c=>c.code),['MX','AR','CO','CL','PT','FR','GB']);
  for(const c of data.countries){
    assert.ok(html.includes(`data-country="${c.code}" href="${c.url.replaceAll('&','&amp;')}"`));
    assert.ok(html.includes(`lang="${c.lang}"`));
    assert.equal(new URL(c.source).protocol,'https:');
  }
  assert.match(html,/corresponde a Inglaterra/);
  assert.match(html,/no ofrecemos versiones nacionales completas/);
  assert.match(html,/no implican colaboración/);
});
test('international help remains static, private and reachable without scripts',()=>{
  assert.doesNotMatch(html,/<form\b|<input\b|<iframe\b|<script(?! type="application\/ld\+json")/);
  assert.match(html,/name="referrer" content="no-referrer"/);
  assert.equal((html.match(/data-country=/g)||[]).length,8);
  assert.ok(readFileSync('webs-amigas.html','utf8').includes('href="/internacional.html"'));
  assert.ok(readFileSync('sitemap.xml','utf8').includes('https://desgracias.es/internacional.html'));
});
