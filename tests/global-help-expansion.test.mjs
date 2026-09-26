import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync as read,existsSync} from 'node:fs';
import {findHelpTopics} from '../src/international-help.js';
import {routeKnownContentQuery} from '../src/search-content-catalog.js';
import {routeSearchQuery} from '../src/search-crisis-router.js';
const data=JSON.parse(read('data/help-directory.json','utf8'));
test('directory is alphabetic, uniquely sourced and country-scoped',()=>{
 const expected=[...data.records].sort((a,b)=>data.categories[a.category].localeCompare(data.categories[b.category],'es')||a.name.localeCompare(b.name,'es')).map(r=>r.id);
 assert.deepEqual(data.records.map(r=>r.id),expected);
 assert.equal(new Set(data.records.map(r=>r.id)).size,data.records.length);
 assert.equal(new Set(data.records.map(r=>r.url)).size,data.records.length);
 for(const r of data.records){assert.ok(data.countries[r.country]);assert.ok(data.categories[r.category]);assert.match(r.language,/^(es|en|fr|pt)$/);if(r.kind==='resource'){assert.equal(r.verification.httpStatus,200);assert.ok(r.verification.title);}}
 assert.equal(data.records.find(r=>r.id==='anar').url,'https://www.anar.org/que-hacemos/telefono-chat-anar/');
 const page=read('webs-amigas.html','utf8');
 const runtime=read('webs-amigas-country-filter.js','utf8');
 assert.ok(page.includes('id="country-buttons"'));
 assert.ok(page.includes('id="friends-groups"'));
 assert.ok(page.includes('src="/webs-amigas-country-filter.js"'));
 assert.ok(runtime.includes("directory.records.filter((record) => record.country === code)"));
 assert.ok(runtime.includes("renderCountry('ES')"));
 assert.ok(runtime.includes('localeCompare'));
});
test('localized equivalents have reciprocal hreflang, self canonicals, privacy and safety',()=>{
 for(const lang of ['es','en','fr','pt']){
  const html=read(`ayuda/${lang}/index.html`,'utf8');
  assert.ok(html.includes(`<html lang="${lang}">`));
  assert.ok(html.includes(`rel="canonical" href="https://desgracias.es/ayuda/${lang}/"`));
  for(const alternate of ['es','en','fr','pt'])assert.ok(html.includes(`hreflang="${alternate}" href="https://desgracias.es/ayuda/${alternate}/"`));
  assert.ok(html.includes('hreflang="x-default"'));
  assert.doesNotMatch(html,/hreflang="(?:en-UK|es-EU)"|visitor-analytics|adsbygoogle|<iframe/);
  assert.match(html,/name="referrer" content="no-referrer"/);
  assert.match(html,/<option value="">/);
  assert.equal((html.match(/data-help-country=/g)||[]).length,9);
  for(const [,href]of html.matchAll(/href="(\/[^"#]*)"/g))assert.ok(existsSync('.'+href+(href.endsWith('/')?'index.html':'')),href);
 }
 const runtime=read('international-help-ui.js','utf8')+read('src/international-help.js','utf8');
 assert.doesNotMatch(runtime,/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie|navigator\.language|location\.(?:search|hash)/);
});
for(const [q,expected] of [['I lost my job','empleo'],['I cannot pay rent','vivienda'],['je cherche un emploi','empleo'],['nao consigo pagar o arrendamento','vivienda'],['no tengo chamba','empleo'],['no tengo laburo','empleo'],['no puedo pagar la renta','vivienda'],['me siento sola','emocional']])test(`localized vocabulary: ${q}`,()=>{const r=findHelpTopics(q);assert.ok(r.categories.includes(expected));assert.equal(r.raw_query_retained,false);assert.ok(!JSON.stringify(r).includes(q));});
for(const q of ['I want to kill myself but need a job','I want to end my life','no quiero vivir','je veux en finir','nao quero viver','me pega mi pareja','no quiero matarme'])test(`keep official safety route available: ${q}`,()=>assert.equal(findHelpTopics(q).safety,true));
test('ambiguous terms need clarification; multiple needs remain multiple',()=>{
 assert.equal(findHelpTopics('I need something').needsClarification,true);
 assert.deepEqual(findHelpTopics('job and rent').categories,['empleo','vivienda']);
 assert.equal(findHelpTopics('party').categories.length,0);
});
for(const [q,intent]of [['no tengo con quien platicar','no_one_to_talk'],['no puedo pagar la renta','housing_payment'],['no me alcanza para el arriendo','housing_payment'],['no puedo mas en la chamba','work_overload'],['no puedo mas en el laburo','work_overload'],['mando hojas de vida y no me llaman','cv_problem'],['no me alcanza la lana para fin de mes','ends_meet']])test(`bounded regional expression: ${q}`,()=>assert.equal(routeKnownContentQuery(q).intent,intent));
test('regional expressions never override the existing Spanish crisis router',()=>{
 assert.equal(routeSearchQuery('quiero matarme y no puedo pagar la renta').safety_level,'P0');
 assert.equal(routeKnownContentQuery('renta').needs_clarification,true);
 assert.equal(routeKnownContentQuery('si puedo pagar la renta').needs_clarification,true);
});
test('resource tree exposes multiple native choices without JS or nested anchors',()=>{
 const html=read('recursos/index.html','utf8');const branches=[...html.matchAll(/<details class="resource-branch">([\s\S]*?)<\/details>/g)];
 assert.equal(branches.length,11);
 for(const [,body] of branches){assert.match(body,/<summary>/);assert.ok((body.match(/<a href=/g)||[]).length>=1);assert.doesNotMatch(body,/<a[^>]*>[^<]*<a/);}
});
