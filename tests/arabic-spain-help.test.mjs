import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync as read} from 'node:fs';
import {findHelpTopics,normalizeHelpText} from '../src/international-help.js';
const page=read('ayuda/ar/index.html','utf8');
test('Arabic is RTL with explicit Spain scope, official sources and isolated telephone numbers',()=>{
 assert.match(page,/<html lang="ar" dir="rtl">/);
 assert.match(page,/value="ES" selected/);
 assert.doesNotMatch(page,/value="MA"|tel:(?!112|024)/);
 for(const number of ['112','024'])assert.ok(page.includes(`href="tel:${number}"><bdi dir="ltr">${number}</bdi>`));
 for(const host of ['www.sanidad.gob.es','inclusion.gob.es'])assert.ok(page.includes(`https://${host}/`));
 assert.doesNotMatch(page,/visitor-analytics|adsbygoogle|<iframe|hreflang="(?:es|fr)"/);
 assert.match(page,/name="referrer" content="no-referrer"/);
 assert.match(page,/ليست ترجمة كاملة بالدارجة/);
 assert.match(page,/لا نضمن توفر مترجم/);
 assert.match(page,/href="\/ayuda\/fr\/"/);
});
for(const [q,category] of [['بغيت الخدمة','empleo'],['ما عنديش باش نخلص الكرا','vivienda'],['بغيت نعرف على الوراق','refugio'],['خاصني الماكلة','social'],['أحتاج مساعدة','social'],['أَنَا بُوحْدِي','emocional']])test(`Arabic and Darija topic: ${q}`,()=>{
 const result=findHelpTopics(q);assert.ok(result.categories.includes(category));assert.equal(result.raw_query_retained,false);assert.ok(!JSON.stringify(result).includes(q));
});
for(const q of ['بغيت نموت','مابغيتش نعيش','بغيت نقتل راسي','لا أريد الانتحار','راجلي كيضربني','أفكر في الانتحار وعندي ديون'])test(`Arabic safety access: ${q}`,()=>assert.equal(findHelpTopics(q).safety,true));
test('unrecognized Arabic asks for clarification without collecting text',()=>{
 assert.equal(findHelpTopics('كلام غير واضح').needsClarification,true);
 assert.equal(normalizeHelpText('إِقَامَة'),'اقامة');
 assert.doesNotMatch(read('international-help-ui.js','utf8')+read('src/international-help.js','utf8'),/fetch\s*\(|sendBeacon|localStorage|sessionStorage|navigator\.language/);
});
test('Arabic entry is visible from main help surfaces and protected from commerce',()=>{
 for(const f of ['index.html','buscar/index.html','ayuda-urgente.html','recursos/index.html'])assert.match(read(f,'utf8'),/href="\/ayuda\/ar\/" lang="ar" dir="rtl"/);
 for(const f of ['SAFETY_ROUTE_INVENTORY.md','SAFETY_MONETIZATION_POLICY.md','opportunity/url-map.mjs'])assert.ok(read(f,'utf8').includes('/ayuda/ar/'));
});
