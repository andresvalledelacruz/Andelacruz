import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../ops/ops.js', import.meta.url), 'utf8');
const fn = source.slice(source.indexOf('async function loadConsole()'), source.indexOf('function messageNode('));
async function run(summaryStatus, pendingStatus) {
  const nodes = new Map();
  const node = id => { if (!nodes.has(id)) nodes.set(id, {textContent:'old'}); return nodes.get(id); };
  let cleared = false, loggedOut = false;
  const context = {
    Intl, Date, Promise, Number, queueLength:metric=>metric?.queue_length||0, refreshButton:{}, queueItems:[], selectedItem:null,
    queueCount:node('queueCount'), queueList:{replaceChildren:message=>node('queue').textContent=message},
    document:{querySelector:node}, loadBusinessMetrics:async()=>{}, messageNode:text=>text,
    clearReview:()=>{cleared=true;}, renderQueue:()=>{node('queue').textContent='loaded';},
    logout:()=>{loggedOut=true;},
    api:async path=>{
      const status=path.includes('summary')?summaryStatus:pendingStatus;
      if(status!==200) throw Object.assign(new Error('unavailable'),{status});
      return path.includes('summary')?{queues:{moderation:{queue_length:7}}}:{items:[]};
    }
  };
  vm.createContext(context);vm.runInContext(fn,context);await context.loadConsole();
  return {nodes,cleared,loggedOut,context};
}
test('moderation 403 preserves healthy summary and explains personal identity/MFA',async()=>{
  const {nodes,cleared,context}=await run(200,403);
  assert.equal(nodes.get('#metricApi').textContent,'OK');
  assert.equal(nodes.get('#metricModeration').textContent,7);
  assert.match(nodes.get('queue').textContent,/Acceso restringido.*identidad personal.*MFA/);
  assert.equal(nodes.get('queueCount').textContent,'—');
  assert.equal(cleared,true);assert.equal(context.refreshButton.disabled,false);
});
test('queue outage does not turn healthy summary into API error',async()=>{
  const {nodes}=await run(200,503);assert.equal(nodes.get('#metricApi').textContent,'OK');assert.match(nodes.get('queue').textContent,/No se pudo cargar/);
});
test('summary failure clears stale counters while queue can still load',async()=>{
  const {nodes}=await run(503,200);assert.equal(nodes.get('#metricApi').textContent,'ERROR');assert.equal(nodes.get('#metricModeration').textContent,'—');assert.equal(nodes.get('queue').textContent,'loaded');
});
test('expired authentication returns to login',async()=>{assert.equal((await run(200,401)).loggedOut,true);});
