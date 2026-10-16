import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';

function handler(slug) {
  const source=fs.readFileSync(`supabase/functions/${slug}/index.ts`,'utf8').replace(/^import .*;\s*$/gm,'');
  let serve;const calls=[];
  const context={Request,Response,TextEncoder,crypto,console,
    Deno:{env:{get:()=>undefined},serve:fn=>serve=fn},
    createClient(){calls.push('database');throw Error('Database must not be reached');},
    fetch(){calls.push('fetch');throw Error('Network must not be reached');}};
  vm.runInNewContext(stripTypeScriptTypes(source),context);
  return {serve,calls};
}

test('Paused submission rejects before reading personal data, auth or database access',async()=>{
  const {serve,calls}=handler('submit-story');
  for(const authorization of ['', 'Bearer not-a-real-session']){
    let reads=0;
    const request={method:'POST',headers:new Headers({origin:'https://desgracias.es',authorization}),text(){reads++;throw Error('Must not read body');}};
    const response=await serve(request);
    assert.equal(response.status,503);
    assert.deepEqual(await response.json(),{error:'publication_paused'});
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.equal(reads,0);assert.deepEqual(calls,[]);
  }
});

test('Pause retains origin enforcement, preflight and method restrictions',async()=>{
  const {serve,calls}=handler('submit-story');
  for(const [method,origin,status] of [['OPTIONS','https://desgracias.es',204],['OPTIONS','https://invalid.example',403],['POST','https://invalid.example',403],['GET','https://desgracias.es',405]]){
    const response=await serve(new Request('https://example.org',{method,headers:{origin}}));
    assert.equal(response.status,status);
  }
  assert.deepEqual(calls,[]);
});

test('Withdrawal remains available and rejects malformed codes without touching database',async()=>{
  const {serve,calls}=handler('withdraw-story');
  const response=await serve(new Request('https://example.org',{method:'POST',headers:{origin:'https://desgracias.es'},body:JSON.stringify({code:'invalid'})}));
  assert.equal(response.status,400);
  assert.deepEqual(await response.json(),{error:'invalid_withdrawal_code'});
  assert.deepEqual(calls,[]);
});
