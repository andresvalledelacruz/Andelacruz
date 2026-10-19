import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {readBusinessMetrics,validateAwinSnapshot,loadAwinSnapshot} from '../src/ops-business-metrics.js';
const now=new Date('2026-10-16T14:00:00Z');
const fixture=()=>({source:'awin_authenticated_export',account_name:'Desgracias.es',market:'ES',currency:'EUR',timezone:'Europe-Paris',period:{from:'2026-09-01',to:'2026-10-15'},observed_at:'2026-10-16T12:00:00Z',conversion_statuses:['pending','confirmed','bonus'],impressions:70,clicks:7,sales:2,commission_minor:3456});

test('Awin projects scoped metrics without inferring global income or exposing private fields',async()=>{
 const result=await readBusinessMetrics(null,now,{awinSnapshot:{...fixture(),email:'private@example.org',token:'do-not-project'}});
 assert.equal(result.awin.commission_minor,3456);assert.equal(result.awin.refresh,'manual');
 assert.equal(result.revenue.value,null);assert.equal(result.conversions.value,null);assert.equal(result.adtraction.value,null);
 assert.doesNotMatch(JSON.stringify(result),/private@example|do-not-project/);
});
test('Awin requires correct source, scope, period, statuses and monetary units',async()=>{
 for(const patch of [{source:'other'},{account_name:'Other'},{currency:'GBP'},{market:'GB'},{timezone:'UTC'},{clicks:'7'},{sales:-1},{commission_minor:1.1},{commission_minor:9007199254740992},{conversion_statuses:['confirmed']},{conversion_statuses:Array(3)},{period:{from:'2026-02-30',to:'2026-10-15'}},{period:{from:'2026-10-16',to:'2026-10-15'}},{period:{from:'2026-10-15',to:'2026-10-16'}},{observed_at:'2026-10-17T12:00:00Z'},{observed_at:'2026-10-14T12:00:00Z'}])assert.equal(validateAwinSnapshot({...fixture(),...patch},now),null);
 const zero=validateAwinSnapshot({...fixture(),impressions:0,clicks:0,sales:0,commission_minor:0},now);assert.equal(zero.commission_minor,0);
 for(const awinSnapshot of [undefined,null,{}])assert.equal((await readBusinessMetrics(null,now,{awinSnapshot})).awin.value,null);
 assert.equal(await loadAwinSnapshot('missing-awin-snapshot.json'),null);
});
test('Awin UI labels its scope and clears stale values on failed refresh',async()=>{
 const source=await readFile(new URL('../ops/ops.js',import.meta.url),'utf8');const fn=source.slice(source.indexOf('function renderBusinessMetrics('),source.indexOf('async function loadBusinessMetrics('));
 const nodes=new Map();const context={Intl,Number,formatDate:()=> 'fecha',document:{querySelector:id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);}}};vm.createContext(context);vm.runInContext(fn,context);
 context.renderBusinessMetrics({awin:validateAwinSnapshot(fixture(),now)});assert.match(nodes.get('#businessAwin').textContent,/34,56/);assert.match(nodes.get('#businessAwinCoverage').textContent,/Europe-Paris.*pendiente.*no acredita pagos ni ingresos globales/);
 context.renderBusinessMetrics(null);assert.equal(nodes.get('#businessAwin').textContent,'BLOQUEADO');
});
