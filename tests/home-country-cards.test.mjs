import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const html=readFileSync('index.html','utf8');
const countryDirectory=readFileSync('data/help-directory.json','utf8');
const win={};runInNewContext(readFileSync('country-options.js','utf8'),{window:win});
const options=Array.from(win.DesgraciasCountryOptions);
const covered=new Set(JSON.parse(countryDirectory).records.filter(r=>r.kind==='resource').map(r=>r.country));covered.add('ES');
test('home country links follow the single options source and reviewed coverage',()=>{
 const region=html.match(/<!-- country-cards:start -->([\s\S]*?)<!-- country-cards:end -->/)?.[1];
 assert.ok(region);
 assert.ok(html.indexOf('<strong>Importante:</strong>')<html.indexOf('<!-- country-cards:start -->'));
 assert.ok(html.indexOf('<!-- country-cards:end -->')<html.indexOf('<section class="professionals'));
 assert.equal((region.match(/href="\/recursos\/#pais-[A-Z]{2}"/g)||[]).length,options.length);
 for(const [code,name] of options){
  assert.ok(region.includes(`data-country="${code}" href="/recursos/#pais-${code}"`),code);
  assert.ok(region.includes(`aria-label="Ver recursos de ${name}"`),code);
  const card=region.match(new RegExp(`<a class="([^"]+)" data-country="${code}"`));
  assert.equal(card[1].includes('country-unavailable'),!covered.has(code),code);
 }
 assert.match(region,/opciones atenuadas aún no tienen enlaces revisados/);
 assert.ok(html.includes('/assets/country-card.css?v=20260927-4'));
});
