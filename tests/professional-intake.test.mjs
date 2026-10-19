import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProfessionalApplication, professionalIntakeConfiguration, receiveProfessionalApplication,
  listProfessionalApplications, reviewProfessionalApplication } from '../src/professional-intake.js';
import { buildOpsAuthorizationContext } from '../src/ops-authz.js';
import { authorizeOpsAction, OPS_CAPABILITIES } from '../src/ops-rbac.js';
import { readBusinessMetrics } from '../src/ops-business-metrics.js';
import Fastify from 'fastify';
import { handleProfessionalApplication } from '../src/professional-intake-http.js';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const requestId = '11111111-1111-4111-8111-111111111111';
const receiptId = '22222222-2222-4222-8222-222222222222';
const now = new Date('2026-10-19T15:00:00Z');
const input = {request_id:requestId,name:'Synthetic professional',profession:'Formación',website:'https://example.org',
  specialties:'Formación profesional',audience:'Personas adultas',description:'Descripción sintética para pruebas',area:'España',
  modality:'Online',languages:'Español',pricing:'Consultar presupuesto',email:'synthetic@example.org',
  privacy_acknowledged:true,truth_confirmed:true,commercial_opt_in:false};
const env = {PROFESSIONAL_INTAKE_ENABLED:'true',PROFESSIONAL_INTAKE_RETENTION_READY:'true',
  PROFESSIONAL_INTAKE_REVIEW_READY:'true',PROFESSIONAL_INTAKE_PRIVACY_REVIEW:'test-review-v1',PROFESSIONAL_INTAKE_RETENTION_DAYS:'30'};
const configuration = professionalIntakeConfiguration(env);
const principal = {subject:'33333333-3333-4333-8333-333333333333',role:'admin',aal:'aal2',transitional:false};
function database(respond = () => ({rows:[]})) {
  const calls=[];
  const client={query:async (sql,args) => {calls.push({sql,args});return respond(sql,args);},release:()=>{calls.push({sql:'release'});}};
  return {calls,connect:async()=>client,query:client.query};
}

test('intake is disabled unless every operational and privacy prerequisite is explicitly configured', async () => {
  for (const key of Object.keys(env)) assert.equal(professionalIntakeConfiguration({...env,[key]:undefined}).enabled,false,key);
  for (const days of ['0','91','1.5','bad']) assert.equal(professionalIntakeConfiguration({...env,PROFESSIONAL_INTAKE_RETENTION_DAYS:days}).enabled,false);
  assert.equal(configuration.enabled,true);
  const pool=database();
  await assert.rejects(receiveProfessionalApplication(pool,input,{configuration:professionalIntakeConfiguration({})}),{code:'professional_intake_disabled'});
  assert.equal(pool.calls.length,0);
});

test('rejects arbitrary help text, revenue claims, malformed contact data and missing acknowledgements', () => {
  for (const patch of [{query:'sensitive'},{story:'sensitive'},{revenue:100},{status:'published'},
    {publication_authorized:true},{privacy_acknowledged:false},{truth_confirmed:false},{commercial_opt_in:'false'},
    {email:'not-email'},{website:'http://example.org'},{website:'https://user:password@example.org'},
    {website:'https://example.org/?private=1'},{name:'<script>'},{description:'x'.repeat(701)},{request_id:'bad'}]) {
    assert.throws(()=>validateProfessionalApplication({...input,...patch}),{code:'invalid_application'});
  }
  assert.equal(validateProfessionalApplication(input).payload.commercial_opt_in,false);
});

test('acknowledges receipt only after commit and returns no contact or commercial data', async () => {
  const pool=database(sql=>({rows:sql.includes('count(*)')?[{received:0}]:[]}));
  const receipt=await receiveProfessionalApplication(pool,input,{configuration,now});
  assert.equal(receipt.status,'received_pending_review');
  assert.deepEqual(Object.keys(receipt).sort(),['receipt_id','status']);
  assert.doesNotMatch(JSON.stringify(receipt),/synthetic@|email|commercial_opt_in|published/);
  const insert=pool.calls.find(c=>c.sql.includes('insert into'));
  assert.equal(insert.args[6],'2026-11-18T15:00:00.000Z');
  assert.equal(insert.args[7],true,'synthetic by default, never trust a client test/real flag');
  assert.deepEqual(pool.calls.slice(-2).map(c=>c.sql),['commit','release']);
});

test('database failure rolls back, releases the connection and cannot return a success receipt', async () => {
  const pool=database(sql=>{if(sql.includes('insert into'))throw new Error('private@example.org db failure');return {rows:[]};});
  await assert.rejects(receiveProfessionalApplication(pool,input,{configuration,now}),{code:'professional_intake_unavailable'});
  assert.deepEqual(pool.calls.slice(-2).map(c=>c.sql),['rollback','release']);
});

test('shared submission budget and conflicting retries fail without inserting a second application', async () => {
  for (const [respond,code] of [
    [sql=>({rows:sql.includes('count(*)')?[{received:100}]:[]}),'intake_capacity_reached'],
    [sql=>({rows:sql.includes('payload_digest')?[{receipt_id:receiptId,payload_digest:'different'}]:[]}),'request_conflict']
  ]) {
    const pool=database(respond);
    await assert.rejects(receiveProfessionalApplication(pool,input,{configuration,now}),{code});
    assert.equal(pool.calls.some(c=>c.sql.includes('insert into')),false);
    assert.ok(pool.calls.some(c=>c.sql.includes('pg_advisory_xact_lock')));
  }
});

test('named admin and MFA are required; shared staging token cannot read or review professional applications', async () => {
  for (const p of [null,{...principal,transitional:true},{...principal,transitional:undefined},{...principal,aal:'aal1'},
    {...principal,role:'analyst'},{...principal,subject:'legacy:staging-ops-token'}]) {
    const pool=database();
    await assert.rejects(listProfessionalApplications(pool,p),{code:'individual_reviewer_required'});
    assert.equal(pool.calls.length,0);
  }
  for (const [method,route] of [['GET','/ops/professionals/applications'],['POST','/ops/professionals/:applicationId/review']]) {
    const auth=buildOpsAuthorizationContext({authorization:'Bearer test-token',configuredToken:'test-token',environment:'staging',method,route});
    assert.equal(auth.allowed,false);
  }
  assert.equal(authorizeOpsAction({role:'admin',capability:OPS_CAPABILITIES.PROFESSIONAL_REVIEW,aal:'aal1'}).allowed,false);
});

test('approval requires complete human evidence and a separate publication authorization; it never publishes or bills', async () => {
  const review={identity_verified:true,credentials_verified:true,terms_verified:true,reviewed_at:'2026-10-19T14:00:00Z',
    expires_at:'2026-11-01T00:00:00Z',sources:['https://example.org/credentials']};
  const makePool=()=>database(sql=>({rows:sql.includes('for update')?[{receipt_id:receiptId,status:'pending_review',payload:validateProfessionalApplication(input).payload}]:[]}));
  for(const patch of [{publication_authorization_reference:undefined},{review:{...review,credentials_verified:false}},
    {review:{...review,expires_at:'2026-10-18T00:00:00Z'}},{review:{...review,sources:['http://example.org']}},
    {review:{...review,reviewer_reference:'client-supplied'}}]) {
    await assert.rejects(reviewProfessionalApplication(makePool(),receiptId,
      {decision:'approve_for_publication',review,publication_authorization_reference:'authorization-test-v1',...patch},principal,now));
  }
  const pool=makePool();
  const result=await reviewProfessionalApplication(pool,receiptId,
    {decision:'approve_for_publication',review,publication_authorization_reference:'authorization-test-v1'},principal,now);
  assert.deepEqual(result,{receipt_id:receiptId,status:'approved_for_publication',published:false});
  const candidate=JSON.parse(pool.calls.find(c=>c.sql.startsWith('update')).args[2]);
  assert.equal(candidate.review.reviewer_reference,principal.subject);
  assert.doesNotMatch(JSON.stringify(candidate),/synthetic@example|commercial_opt_in|register|phone/);
  assert.equal(pool.calls.some(c=>/commercial_events|conversion|pageview/.test(c.sql)),false);
});

test('Fastify intake respects origin denial, disabled state, payload limit and transactional receipt semantics', async () => {
  const pool=database(sql=>({rows:sql.includes('count(*)')?[{received:0}]:[]}));
  let config=professionalIntakeConfiguration({});
  const app=Fastify({logger:false});
  app.post('/public/professional-applications',{bodyLimit:8192},(request,reply)=>handleProfessionalApplication(request,reply,{
    pool,environment:'staging',configuration:config,
    allowPublicOriginOrDeny:(req,res)=>{
      if(req.headers.origin !== 'https://desgracias-staging.pages.dev') {res.code(403).send({error:'origin_not_allowed'});return false;}
      return true;
    }
  }));
  const send=(payload=input,origin='https://desgracias-staging.pages.dev')=>app.inject({method:'POST',url:'/public/professional-applications',headers:{origin},payload});
  try {
    assert.equal((await send(input,'https://untrusted.example')).statusCode,403);
    assert.equal((await send()).statusCode,503);
    assert.equal(pool.calls.length,0);
    config=configuration;
    assert.equal((await send({...input,description:'x'.repeat(9000)})).statusCode,413);
    assert.equal((await send({...input,query:'not accepted'})).statusCode,400);
    const response=await send();
    assert.equal(response.statusCode,202);
    assert.equal(response.json().status,'received_pending_review');
    assert.doesNotMatch(response.body,/synthetic@|email|description/);
  } finally {await app.close();}
});

test('Ops counts received applications separately from leads and excludes synthetic data', async () => {
  const queries=[];
  const pool={query:async sql=>{queries.push(sql);return {rows:sql.includes('received_applications')?
    [{received_applications:'2'}]:[{pageviews:'5',days_with_data:1}]};}};
  const report=await readBusinessMetrics(pool,now,{professionalIntakeEnabled:true});
  assert.equal(report.requests.value,2);
  assert.equal(report.requests.synthetic_excluded,true);
  assert.equal(report.leads.value,null);assert.equal(report.conversions.value,null);assert.equal(report.revenue.value,null);
  assert.match(queries[0],/synthetic = false/);
  assert.doesNotMatch(queries[0],/select\s+\*|payload|email|phone/);
  const absent=await readBusinessMetrics({query:async sql=>({rows:sql.includes('received_applications')?
    [{received_applications:undefined}]:[{pageviews:null}]})},now,{professionalIntakeEnabled:true});
  assert.equal(absent.requests.value,null);
});

test('Ops UI distinguishes retained received requests from leads and clears stale counts on outage', () => {
  const source=readFileSync('ops/ops.js','utf8');
  const fn=source.slice(source.indexOf('function renderBusinessMetrics('),source.indexOf('async function loadBusinessMetrics('));
  const nodes=new Map();
  const context={Intl,Number,formatDate:()=>'',document:{querySelector:id=>{
    if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);
  }}};
  vm.createContext(context);vm.runInContext(fn,context);
  context.renderBusinessMetrics({requests:{status:'REGISTRADO',value:2,definition:'received_professional_applications_not_leads',synthetic_excluded:true}});
  assert.equal(nodes.get('#businessRequests').textContent,'2');
  assert.match(nodes.get('#businessRequestsCoverage').textContent,/no son leads ni ventas.*retención/);
  context.renderBusinessMetrics(null);
  assert.equal(nodes.get('#businessRequests').textContent,'BLOQUEADO');
});
