import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProfessionalApplication, professionalIntakeConfiguration, receiveProfessionalApplication,
  professionalRetentionPurgeConfiguration, planExpiredProfessionalApplications, purgeExpiredProfessionalApplications,
  listProfessionalApplications, previewProfessionalPublicProfile, reviewProfessionalApplication } from '../src/professional-intake.js';
import { buildOpsAuthorizationContext } from '../src/ops-authz.js';
import { authorizeOpsAction, OPS_CAPABILITIES } from '../src/ops-rbac.js';
import { readBusinessMetrics } from '../src/ops-business-metrics.js';
import Fastify from 'fastify';
import { handleProfessionalApplication } from '../src/professional-intake-http.js';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const requestId = '11111111-1111-4111-8111-111111111111';
const receiptId = '22222222-2222-4222-8222-222222222222';
const now = new Date('2026-10-19T15:00:00Z');
const purgeSecret = 'synthetic-confirmation-secret-for-tests-only';
const input = {request_id:requestId,name:'Synthetic professional',profession:'Formación',
  register_authority:'Registro sintético de prueba',register:'TEST-123',
  register_url:'https://example.org/registro?id=TEST-123',insurance_evidence:'Cobertura declarada de prueba',
  website:'https://example.org',
  specialties:'Formación profesional',audience:'Personas adultas',description:'Descripción sintética para pruebas',area:'España',
  country:'España',service_countries:'España',modality:'Online',languages:'Español',
  pricing:'Consultar presupuesto',email:'synthetic@example.org',
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

test('retention purge is separately gated and bounded before any database access', async () => {
  const pool=database();
  for (const purgeEnv of [{}, {PROFESSIONAL_INTAKE_PURGE_ENABLED:'false'},
    {PROFESSIONAL_INTAKE_PURGE_ENABLED:'true'},
    {PROFESSIONAL_INTAKE_PURGE_ENABLED:'true',PROFESSIONAL_INTAKE_PURGE_MODE:'delete'},
    {PROFESSIONAL_INTAKE_PURGE_ENABLED:'true',PROFESSIONAL_INTAKE_PURGE_MODE:'plan'},
    {PROFESSIONAL_INTAKE_PURGE_ENABLED:'true',PROFESSIONAL_INTAKE_PURGE_MODE:'commit',
      PROFESSIONAL_INTAKE_PURGE_CONFIRMATION_SECRET:purgeSecret},
    {PROFESSIONAL_INTAKE_PURGE_ENABLED:'true',PROFESSIONAL_INTAKE_PURGE_BATCH_SIZE:'0'},
    {PROFESSIONAL_INTAKE_PURGE_ENABLED:'true',PROFESSIONAL_INTAKE_PURGE_BATCH_SIZE:'1001'},
    {PROFESSIONAL_INTAKE_PURGE_ENABLED:'true',PROFESSIONAL_INTAKE_PURGE_BATCH_SIZE:'1.5'}]) {
    const purgeConfiguration=professionalRetentionPurgeConfiguration(purgeEnv);
    assert.equal(purgeConfiguration.enabled,false);
    await assert.rejects(purgeExpiredProfessionalApplications(pool,{configuration:purgeConfiguration,now}),
      {code:'professional_retention_purge_commit_required'});
  }
  assert.equal(pool.calls.length,0);
  assert.deepEqual(professionalRetentionPurgeConfiguration({PROFESSIONAL_INTAKE_PURGE_ENABLED:'true',
    PROFESSIONAL_INTAKE_PURGE_MODE:'plan',PROFESSIONAL_INTAKE_PURGE_CONFIRMATION_SECRET:purgeSecret}),
  {enabled:true,mode:'plan',batchSize:250,confirmationSecret:purgeSecret,planToken:null});
});

test('retention planning is read-only, bounded and reports only aggregates', async () => {
  const pool=database(sql=>({rows:sql.includes('from expired group by')?[
    {synthetic:true,status:'pending_review',count:2},
    {synthetic:false,status:'withdrawn',count:3}
  ]:[]}));
  const configuration=professionalRetentionPurgeConfiguration({PROFESSIONAL_INTAKE_PURGE_ENABLED:'true',
    PROFESSIONAL_INTAKE_PURGE_MODE:'plan',PROFESSIONAL_INTAKE_PURGE_BATCH_SIZE:'25',
    PROFESSIONAL_INTAKE_PURGE_CONFIRMATION_SECRET:purgeSecret});
  const plan=await planExpiredProfessionalApplications(pool,{configuration,now});
  assert.deepEqual({...plan,confirmation:undefined},
    {eligible:5,synthetic:2,non_synthetic:3,confirmation:undefined});
  assert.match(plan.confirmation,/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  assert.doesNotMatch(plan.confirmation,/pending_review|withdrawn|example|receipt/i);
  const confirmationPayload=JSON.parse(Buffer.from(plan.confirmation.split('.')[0],'base64url').toString('utf8'));
  assert.match(confirmationPayload.plan_id,/^[0-9a-f-]{36}$/i);
  assert.deepEqual(Object.keys(confirmationPayload).sort(),
    ['batch_size','cutoff','eligible','non_synthetic','plan_id','synthetic','version']);
  const planning=pool.calls.find(call=>call.sql.includes('from expired group by'));
  assert.match(planning.sql,/expires_at <= \$1::timestamptz/);
  assert.match(planning.sql,/order by expires_at asc, receipt_id asc/);
  assert.match(planning.sql,/limit \$2/);
  assert.doesNotMatch(planning.sql,/delete|for update|payload|email|phone|public_profile/i);
  assert.deepEqual(planning.args,[now.toISOString(),25]);
  assert.equal(pool.calls.some(call=>/begin|commit|rollback/.test(call.sql)),false);
  await assert.rejects(purgeExpiredProfessionalApplications(pool,{configuration,now}),
    {code:'professional_retention_purge_commit_required'});
});

test('retention planning fails closed on malformed or impossible aggregates', async () => {
  const configuration={enabled:true,mode:'plan',batchSize:25,confirmationSecret:purgeSecret};
  for (const rows of [null,
    [{synthetic:'false',status:'withdrawn',count:1}],
    [{synthetic:false,status:'unknown',count:1}],
    [{synthetic:false,status:'withdrawn',count:'not-a-number'}],
    [{synthetic:false,status:'withdrawn',count:26}]]) {
    const pool=database(()=>({rows}));
    await assert.rejects(planExpiredProfessionalApplications(pool,{configuration,now}),
      {code:'professional_retention_purge_unavailable'});
    assert.equal(pool.calls.some(call=>/delete|for update/i.test(call.sql)),false);
  }
});

test('retention purge deletes only expired rows in a bounded locked transaction and reports aggregates', async () => {
  const rows=[
    {synthetic:true,status:'pending_review'},
    {synthetic:false,status:'withdrawn'},
    {synthetic:false,status:'rejected'}
  ];
  const planPool=database(sql=>({rows:sql.includes('from expired group by')?[
    {synthetic:true,status:'pending_review',count:1},
    {synthetic:false,status:'withdrawn',count:2}
  ]:[]}));
  const planConfiguration=professionalRetentionPurgeConfiguration({PROFESSIONAL_INTAKE_PURGE_ENABLED:'true',
    PROFESSIONAL_INTAKE_PURGE_MODE:'plan',PROFESSIONAL_INTAKE_PURGE_BATCH_SIZE:'25',
    PROFESSIONAL_INTAKE_PURGE_CONFIRMATION_SECRET:purgeSecret});
  const plan=await planExpiredProfessionalApplications(planPool,{configuration:planConfiguration,now});
  const pool=database(sql=>({rows:sql.includes('delete from private.professional_applications')?rows:[]}));
  const configuration=professionalRetentionPurgeConfiguration({PROFESSIONAL_INTAKE_PURGE_ENABLED:'true',
    PROFESSIONAL_INTAKE_PURGE_MODE:'commit',PROFESSIONAL_INTAKE_PURGE_BATCH_SIZE:'25',
    PROFESSIONAL_INTAKE_PURGE_CONFIRMATION_SECRET:purgeSecret,
    PROFESSIONAL_INTAKE_PURGE_PLAN_TOKEN:plan.confirmation});
  assert.deepEqual(await purgeExpiredProfessionalApplications(pool,{configuration,now}),
    {deleted:3,synthetic:1,non_synthetic:2});
  assert.ok(pool.calls.some(call=>call.sql.includes('pg_advisory_xact_lock')));
  const receipt=pool.calls.find(call=>call.sql.includes('professional_retention_purge_receipts'));
  assert.match(receipt.sql,/insert into private\.professional_retention_purge_receipts/);
  assert.equal(receipt.args[1],now.toISOString());
  assert.deepEqual(receipt.args.slice(2),[25,3,1,2,now.toISOString()]);
  const deletion=pool.calls.find(call=>call.sql.includes('delete from private.professional_applications'));
  assert.match(deletion.sql,/expires_at <= \$1::timestamptz/);
  assert.match(deletion.sql,/order by expires_at asc, receipt_id asc/);
  assert.match(deletion.sql,/limit \$2/);
  assert.match(deletion.sql,/for update skip locked/);
  assert.match(deletion.sql,/having count\(\*\)::int = \$3/);
  assert.match(deletion.sql,/returning application\.synthetic, application\.status/);
  assert.deepEqual(deletion.args,[now.toISOString(),25,3,1]);
  assert.doesNotMatch(deletion.sql,/payload|email|phone|public_profile/);
  assert.deepEqual(pool.calls.slice(-2).map(call=>call.sql),['commit','release']);
});

test('retention purge rolls back on malformed results and never reports operational success', async () => {
  const planPool=database(sql=>({rows:sql.includes('from expired group by')?[
    {synthetic:false,status:'withdrawn',count:1}
  ]:[]}));
  const plan=await planExpiredProfessionalApplications(planPool,{configuration:{enabled:true,mode:'plan',batchSize:10,
    confirmationSecret:purgeSecret},now});
  for (const response of [{}, {rows:[{synthetic:'false',status:'withdrawn'}]},
    {rows:[{synthetic:false,status:'unknown'}]}]) {
    const pool=database(sql=>sql.includes('delete from private.professional_applications')?response:{rows:[]});
    await assert.rejects(purgeExpiredProfessionalApplications(pool,{configuration:{enabled:true,mode:'commit',batchSize:10,
      confirmationSecret:purgeSecret,planToken:plan.confirmation},now}),
      {code:'professional_retention_purge_unavailable'});
    assert.deepEqual(pool.calls.slice(-2).map(call=>call.sql),['rollback','release']);
  }
});

test('retention commit requires a fresh authentic matching plan before database access', async () => {
  const planPool=database(sql=>({rows:sql.includes('from expired group by')?[
    {synthetic:false,status:'withdrawn',count:1}
  ]:[]}));
  const plan=await planExpiredProfessionalApplications(planPool,{configuration:{enabled:true,mode:'plan',batchSize:10,
    confirmationSecret:purgeSecret},now});
  for (const [planToken,runAt,code] of [
    [undefined,now,'professional_retention_purge_commit_required'],
    [`${plan.confirmation}x`,now,'professional_retention_purge_confirmation_required'],
    [plan.confirmation,new Date(now.getTime()+16*60*1000),'professional_retention_purge_confirmation_expired']
  ]) {
    const pool=database();
    await assert.rejects(purgeExpiredProfessionalApplications(pool,{configuration:{enabled:true,mode:'commit',batchSize:10,
      confirmationSecret:purgeSecret,planToken},now:runAt}),{code});
    assert.equal(pool.calls.length,0);
  }
  const wrongSecretPool=database();
  await assert.rejects(purgeExpiredProfessionalApplications(wrongSecretPool,{configuration:{enabled:true,mode:'commit',batchSize:10,
    confirmationSecret:`${purgeSecret}-wrong`,planToken:plan.confirmation},now}),
  {code:'professional_retention_purge_confirmation_required'});
  assert.equal(wrongSecretPool.calls.length,0);
});

test('retention commit rolls back without deleting when the planned aggregate changed', async () => {
  const planPool=database(sql=>({rows:sql.includes('from expired group by')?[
    {synthetic:false,status:'withdrawn',count:2}
  ]:[]}));
  const plan=await planExpiredProfessionalApplications(planPool,{configuration:{enabled:true,mode:'plan',batchSize:10,
    confirmationSecret:purgeSecret},now});
  const pool=database(sql=>({rows:sql.includes('delete from private.professional_applications')?[]:[]}));
  await assert.rejects(purgeExpiredProfessionalApplications(pool,{configuration:{enabled:true,mode:'commit',batchSize:10,
    confirmationSecret:purgeSecret,planToken:plan.confirmation},now}),
  {code:'professional_retention_purge_plan_changed'});
  assert.deepEqual(pool.calls.slice(-2).map(call=>call.sql),['rollback','release']);
});

test('retention confirmation is single-use and a replay cannot reach deletion', async () => {
  const planPool=database(sql=>({rows:sql.includes('from expired group by')?[
    {synthetic:false,status:'withdrawn',count:1}
  ]:[]}));
  const plan=await planExpiredProfessionalApplications(planPool,{configuration:{enabled:true,mode:'plan',batchSize:10,
    confirmationSecret:purgeSecret},now});
  const pool=database(sql=>{
    if(sql.includes('professional_retention_purge_receipts')) {
      throw Object.assign(new Error('duplicate plan id'),{code:'23505'});
    }
    return {rows:[]};
  });
  await assert.rejects(purgeExpiredProfessionalApplications(pool,{configuration:{enabled:true,mode:'commit',batchSize:10,
    confirmationSecret:purgeSecret,planToken:plan.confirmation},now}),
  {status:409,code:'professional_retention_purge_confirmation_used'});
  assert.equal(pool.calls.some(call=>call.sql.includes('delete from private.professional_applications')),false);
  assert.deepEqual(pool.calls.slice(-2).map(call=>call.sql),['rollback','release']);
});

test('rejects arbitrary help text, revenue claims, malformed contact data and missing acknowledgements', () => {
  for (const patch of [{query:'sensitive'},{story:'sensitive'},{revenue:100},{status:'published'},
    {publication_authorized:true},{privacy_acknowledged:false},{truth_confirmed:false},{commercial_opt_in:'false'},
    {email:'not-email'},{website:'http://example.org'},{website:'https://user:password@example.org'},
    {website:'https://example.org/?private=1'},{name:'<script>'},{description:'x'.repeat(701)},{request_id:'bad'}]) {
    assert.throws(()=>validateProfessionalApplication({...input,...patch}),{code:'invalid_application'});
  }
  assert.equal(validateProfessionalApplication(input).payload.commercial_opt_in,false);
  assert.equal(validateProfessionalApplication(input).payload.register_url,'https://example.org/registro?id=TEST-123');
  for (const patch of [{country:''},{service_countries:''},{register_url:'http://example.org/registro'},
    {register_url:'https://user:password@example.org/registro'}]) {
    assert.throws(()=>validateProfessionalApplication({...input,...patch}),{code:'invalid_application'});
  }
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

test('an expired request ID returns a conflict instead of attempting a duplicate insert', async () => {
  const pool=database(sql=>{
    if(sql.includes('insert into')) throw Object.assign(new Error('duplicate request_id'),{code:'23505'});
    if(sql.includes('count(*)')) return {rows:[{received:0}]};
    return {rows:sql.includes('payload_digest') && !sql.includes('and expires_at >')?
      [{receipt_id:receiptId,payload_digest:'expired',expires_at:now.toISOString()}]:[]};
  });
  await assert.rejects(receiveProfessionalApplication(pool,input,{configuration,now}),
    {status:409,code:'request_expired'});
  assert.equal(pool.calls.some(c=>c.sql.includes('insert into')),false);
  assert.deepEqual(pool.calls.slice(-2).map(c=>c.sql),['rollback','release']);
  const lookup=pool.calls.find(c=>c.sql.includes('payload_digest'));
  assert.doesNotMatch(lookup.sql,/and expires_at >/);
});

test('an unexpired identical retry returns the original receipt without consuming capacity', async () => {
  const digest=createHash('sha256').update(JSON.stringify(validateProfessionalApplication(input).payload)).digest('hex');
  const pool=database(sql=>({rows:sql.includes('payload_digest')?
    [{receipt_id:receiptId,payload_digest:digest,expires_at:new Date(now.getTime()+1000)}]:[]}));
  assert.deepEqual(await receiveProfessionalApplication(pool,input,{configuration,now}),
    {receipt_id:receiptId,status:'received_pending_review'});
  assert.equal(pool.calls.some(c=>/count\(\*\)|insert into/.test(c.sql)),false);
  assert.deepEqual(pool.calls.slice(-2).map(c=>c.sql),['commit','release']);
});

test('named admin and MFA are required; shared staging token cannot read or review professional applications', async () => {
  for (const p of [null,{...principal,transitional:true},{...principal,transitional:undefined},{...principal,aal:'aal1'},
    {...principal,role:'analyst'},{...principal,subject:'legacy:staging-ops-token'}]) {
    const pool=database();
    await assert.rejects(listProfessionalApplications(pool,p),{code:'individual_reviewer_required'});
    assert.equal(pool.calls.length,0);
  }
  for (const [method,route] of [['GET','/ops/professionals/applications'],
    ['GET','/ops/professionals/:applicationId/public-profile'],['POST','/ops/professionals/:applicationId/review']]) {
    const auth=buildOpsAuthorizationContext({authorization:'Bearer test-token',configuredToken:'test-token',environment:'staging',method,route});
    assert.equal(auth.allowed,false);
  }
  assert.equal(authorizeOpsAction({role:'admin',capability:OPS_CAPABILITIES.PROFESSIONAL_REVIEW,aal:'aal1'}).allowed,false);
});

test('approval requires complete human evidence and a separate publication authorization; it never publishes or bills', async () => {
  const review={identity_verified:true,credentials_verified:true,jurisdiction_verified:true,terms_verified:true,
    registration_status:'verified',registration_review_reference:'registration-review-test-v1',
    insurance_status:'not_applicable',insurance_review_reference:'insurance-scope-review-test-v1',reviewed_at:'2026-10-19T14:00:00Z',
    expires_at:'2026-11-01T00:00:00Z',sources:['https://example.org/credentials']};
  const makePool=()=>database(sql=>({rows:sql.includes('for update')?[{receipt_id:receiptId,status:'pending_review',
    payload:validateProfessionalApplication({...input,commercial_opt_in:true}).payload}]:[]}));
  for(const patch of [{publication_authorization_reference:undefined},{review:{...review,credentials_verified:false}},
    {categories:undefined},{categories:[]},{categories:['mental_health']},{categories:['education','education']},
    {review:{...review,jurisdiction_verified:false}},
    {review:Object.fromEntries(Object.entries(review).filter(([key])=>key !== 'jurisdiction_verified'))},
    {review:{...review,registration_status:'pending'}},{review:{...review,registration_review_reference:''}},
    {review:{...review,insurance_status:'declared'}},{review:{...review,insurance_review_reference:''}},
    {review:{...review,expires_at:'2026-10-18T00:00:00Z'}},{review:{...review,sources:['http://example.org']}},
    {review:{...review,reviewer_reference:'client-supplied'}}]) {
    await assert.rejects(reviewProfessionalApplication(makePool(),receiptId,
      {decision:'approve_for_publication',review,categories:['education'],publication_authorization_reference:'authorization-test-v1',...patch},principal,now));
  }
  const pool=makePool();
  const result=await reviewProfessionalApplication(pool,receiptId,
    {decision:'approve_for_publication',review,categories:['education'],publication_authorization_reference:'authorization-test-v1'},principal,now);
  assert.deepEqual(result,{receipt_id:receiptId,status:'approved_for_publication',published:false});
  const candidate=JSON.parse(pool.calls.find(c=>c.sql.startsWith('update')).args[2]);
  assert.match(candidate.id,/^professional-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.notEqual(candidate.id,`professional-${receiptId}`,'public ID must not reveal the private receipt');
  assert.equal(candidate.review.reviewer_reference,principal.subject);
  assert.equal(candidate.publication_authorization_reference,'authorization-test-v1');
  assert.equal(candidate.country,'España');
  assert.equal(candidate.service_countries,'España');
  assert.equal(candidate.review.jurisdiction_verified,true);
  assert.equal(candidate.review.registration_status,'verified');
  assert.equal(candidate.review.insurance_status,'not_applicable');
  assert.equal(candidate.commercial_relationship,'none');
  assert.deepEqual(candidate.categories,['education']);
  assert.doesNotMatch(JSON.stringify(candidate),/synthetic@example|commercial_opt_in|TEST-123|Cobertura declarada de prueba|phone/);
  assert.equal(pool.calls.some(c=>/commercial_events|conversion|pageview/.test(c.sql)),false);
});

test('publication preview revalidates the approved candidate and returns only public fields', async () => {
  const review={identity_verified:true,credentials_verified:true,jurisdiction_verified:true,terms_verified:true,
    registration_status:'verified',registration_review_reference:'private-registration-review',
    insurance_status:'not_applicable',insurance_review_reference:'private-insurance-review',
    reviewer_reference:principal.subject,reviewed_at:'2026-10-19T14:00:00Z',expires_at:'2026-11-01T00:00:00Z',
    sources:['https://evidence.example.org/private?token=secret']};
  const candidate={id:'professional-44444444-4444-4444-8444-444444444444',status:'published',
    publication_authorized:true,publication_authorization_reference:'private-publication-authorization',
    commercial_relationship:'none',name:'Synthetic professional',profession:'Formación',description:'Descripción pública',
    country:'España',area:'Madrid',service_countries:'España',modality:'Online',languages:'Español',
    pricing:'Consultar presupuesto',website:'https://example.org/',categories:['education'],review};
  const pool=database(sql=>({rows:sql.includes('select status, public_profile')?
    [{status:'approved_for_publication',public_profile:candidate}]:[]}));
  const result=await previewProfessionalPublicProfile(pool,receiptId,principal,now);
  assert.equal(result.status,'approved_for_publication');
  assert.equal(result.published,false);
  assert.equal(result.profile.id,candidate.id);
  assert.deepEqual(Object.keys(result).sort(),['profile','published','status']);
  assert.doesNotMatch(JSON.stringify(result),/private-|secret|sources|reviewer_reference|publication_authorization_reference|receipt_id|email|phone/);
  assert.match(pool.calls[0].sql,/expires_at > \$2::timestamptz/);

  for (const row of [null,{status:'pending_review',public_profile:null},
    {status:'approved_for_publication',public_profile:{...candidate,publication_authorized:false}},
    {status:'approved_for_publication',public_profile:{...candidate,review:{...review,expires_at:now.toISOString()}}}]) {
    const rejectedPool=database(sql=>({rows:sql.includes('select status, public_profile') && row?[row]:[]}));
    await assert.rejects(previewProfessionalPublicProfile(rejectedPool,receiptId,principal,now),
      {code:row ? (row.status === 'approved_for_publication' ? 'professional_profile_not_publishable' : 'professional_profile_not_approved') : 'application_not_found'});
  }
  const deniedPool=database();
  await assert.rejects(previewProfessionalPublicProfile(deniedPool,receiptId,{...principal,aal:'aal1'},now),
    {code:'individual_reviewer_required'});
  assert.equal(deniedPool.calls.length,0);
});

test('withdrawal preserves the opaque public ID for governed removal and is idempotent', async () => {
  const publicProfileId='professional-44444444-4444-4444-8444-444444444444';
  const candidate={id:publicProfileId,status:'published',publication_authorized:true,
    publication_authorization_reference:'private-publication-authorization',commercial_relationship:'none'};
  const approvedPool=database(sql=>({rows:sql.includes('for update')?
    [{receipt_id:receiptId,status:'approved_for_publication',payload:{},public_profile:candidate}]:[]}));
  const withdrawn=await reviewProfessionalApplication(approvedPool,receiptId,
    {decision:'withdraw',review:null,categories:null,publication_authorization_reference:null},principal,now);
  assert.deepEqual(withdrawn,{receipt_id:receiptId,status:'withdrawn',published:false,
    withdrawn_public_profile_id:publicProfileId});
  const update=approvedPool.calls.find(call=>call.sql.startsWith('update'));
  assert.equal(update.args[1],'withdrawn');
  assert.equal(JSON.parse(update.args[2]).id,publicProfileId,'private candidate remains traceable until retention cleanup');
  assert.equal(approvedPool.calls.some(call=>/commercial_events|conversion|pageview/.test(call.sql)),false);

  const repeatedPool=database(sql=>({rows:sql.includes('for update')?
    [{receipt_id:receiptId,status:'withdrawn',payload:{},public_profile:candidate}]:[]}));
  assert.deepEqual(await reviewProfessionalApplication(repeatedPool,receiptId,
    {decision:'withdraw',review:null,categories:null,publication_authorization_reference:null},principal,now),withdrawn);
  assert.equal(repeatedPool.calls.some(call=>call.sql.startsWith('update') || call.sql.includes('insert into')),false);
  assert.deepEqual(repeatedPool.calls.slice(-2).map(call=>call.sql),['commit','release']);

  const rejectedPool=database(sql=>({rows:sql.includes('for update')?
    [{receipt_id:receiptId,status:'rejected',payload:{},public_profile:null}]:[]}));
  await assert.rejects(reviewProfessionalApplication(rejectedPool,receiptId,
    {decision:'withdraw',review:null,categories:null,publication_authorization_reference:null},principal,now),
    {code:'application_already_reviewed'});

  const missingIdPool=database(sql=>({rows:sql.includes('for update')?
    [{receipt_id:receiptId,status:'approved_for_publication',payload:{},public_profile:{id:'invalid'}}]:[]}));
  await assert.rejects(reviewProfessionalApplication(missingIdPool,receiptId,
    {decision:'withdraw',review:null,categories:null,publication_authorization_reference:null},principal,now),
    {code:'approved_profile_reference_missing'});
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

test('HTTP preserves the expired retry conflict without returning a receipt or personal data', async () => {
  const pool=database(sql=>({rows:sql.includes('payload_digest')?
    [{receipt_id:receiptId,payload_digest:'expired',expires_at:'2020-01-01T00:00:00Z'}]:[]}));
  const app=Fastify({logger:false});
  app.post('/public/professional-applications',(request,reply)=>handleProfessionalApplication(request,reply,{
    pool,environment:'staging',configuration,allowPublicOriginOrDeny:()=>true
  }));
  try {
    const response=await app.inject({method:'POST',url:'/public/professional-applications',payload:input});
    assert.equal(response.statusCode,409);
    assert.deepEqual(response.json(),{error:'request_expired'});
    assert.equal(pool.calls.some(c=>c.sql.includes('insert into')),false);
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
