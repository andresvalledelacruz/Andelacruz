import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { readBusinessMetrics, validateAdtractionSnapshot, loadAdtractionSnapshot } from '../src/ops-business-metrics.js';

const now = new Date('2026-10-16T14:30:00Z');
const fixture = () => ({source:'adtraction_authenticated_export',channel_url:'https://desgracias.es',market:'ES',currency:'EUR',period:{from:'2026-10-09',to:'2026-10-15'},observed_at:'2026-10-16T12:00:00Z',conversion_statuses:['approved','pending'],clicks:7,unique_clicks:5,conversions:2,commission_minor:1234});

test('network snapshot projects scoped counters without replacing global unknowns',async()=>{
  const result=await readBusinessMetrics(null,now,{adtractionSnapshot:{...fixture(),email:'private@example.org',token:'private-token'}});
  assert.equal(result.adtraction.commission_minor,1234);
  assert.equal(result.adtraction.refresh,'manual');
  assert.deepEqual(result.adtraction.period,{from:'2026-10-09',to:'2026-10-15'});
  assert.equal(result.revenue.value,null);
  assert.equal(result.conversions.value,null);
  assert.doesNotMatch(JSON.stringify(result),/private@example|private-token/);
});

test('zero is recorded only with valid channel, period, currency and statuses',async()=>{
  const zero={...fixture(),clicks:0,unique_clicks:0,conversions:0,commission_minor:0};
  assert.equal(validateAdtractionSnapshot(zero,now).commission_minor,0);
  for(const patch of [{source:'other'},{channel_url:'https://other.example'},{market:'GB'},{currency:'GBP'},{clicks:'7'},{commission_minor:-1},{commission_minor:1.5},{unique_clicks:8},{period:{from:'2026-02-30',to:'2026-10-15'}},{period:{from:'2026-10-15',to:'2026-10-09'}},{period:{from:'2026-10-09',to:'2026-10-16'}},{observed_at:'2026-10-17T12:00:00Z'},{observed_at:'2026-10-14T12:00:00Z'},{conversion_statuses:['approved']},{conversion_statuses:Array(2)}]){
    assert.equal(validateAdtractionSnapshot({...fixture(),...patch},now),null);
  }
  for(const adtractionSnapshot of [undefined,null,{}]){
    const result=await readBusinessMetrics(null,now,{adtractionSnapshot});
    assert.equal(result.adtraction.status,'BLOQUEADO');
    assert.equal(result.adtraction.value,null);
  }
  assert.equal(await loadAdtractionSnapshot('missing-private-snapshot.json'),null);
});

test('UI identifies network commission and clears stale values after failure',async()=>{
  const source=await readFile(new URL('../ops/ops.js',import.meta.url),'utf8');
  const fn=source.slice(source.indexOf('function renderBusinessMetrics('),source.indexOf('async function loadBusinessMetrics('));
  const nodes=new Map();const context={Intl,Number,formatDate:()=> 'fecha',document:{querySelector:id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);}}};
  vm.createContext(context);vm.runInContext(fn,context);
  context.renderBusinessMetrics({adtraction:validateAdtractionSnapshot(fixture(),now)});
  assert.match(nodes.get('#businessAdtraction').textContent,/12,34/);
  assert.match(nodes.get('#businessAdtractionCoverage').textContent,/aprobadas o pendientes.*no acredita pagos ni ingresos globales/);
  context.renderBusinessMetrics(null);
  assert.equal(nodes.get('#businessAdtraction').textContent,'BLOQUEADO');
  assert.equal(nodes.get('#businessAdtractionCoverage').textContent,'Sin exportación verificada de Adtraction');
});
