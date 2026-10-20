import test from 'node:test';
import assert from 'node:assert/strict';
import { opsIdentityConfiguration, supabaseOpsPrincipal, resolveOpsRequestAuthorization } from '../src/ops-supabase-identity.js';
const subject='11111111-1111-4111-8111-111111111111';
const session='22222222-2222-4222-8222-222222222222';
const now=Date.parse('2026-10-20T12:00:00Z');
const env={OPS_SUPABASE_AUTH_ENABLED:'true',OPS_SUPABASE_URL:'https://exampleproject.supabase.co',
  OPS_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test_only',OPS_ADMIN_SUBJECTS:subject};
const configuration=opsIdentityConfiguration(env);
const claims={iss:configuration.origin+'/auth/v1',aud:'authenticated',role:'authenticated',aal:'aal2',sub:subject,session_id:session,exp:now/1000+60};
const token=(changes={},header={alg:'ES256'})=>[header,{...claims,...changes},'signature'].map(x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url')).join('.');
function fixture({changes={},httpOk=true,user={id:subject,is_anonymous:false},active=true}={}) {
 const calls={http:[],sql:[]};
 return {calls,authorization:'Bearer '+token(changes),configuration,clock:()=>now,
  fetchImpl:async(url,options)=>{calls.http.push({url,options});return {ok:httpOk,json:async()=>user};},
  pool:{query:async query=>{calls.sql.push(query);return {rows:[{active}]};}}};
}
test('nominal Auth is opt-in and requires a server-selected project, publishable key and UUID allowlist',()=>{
 assert.ok(configuration);
 for(const overrides of [{OPS_SUPABASE_AUTH_ENABLED:'false'},{OPS_SUPABASE_URL:'http://exampleproject.supabase.co'},
  {OPS_SUPABASE_URL:'https://exampleproject.supabase.co.attacker.test'}, {OPS_SUPABASE_URL:'https://exampleproject.supabase.co/path'},
  {OPS_SUPABASE_URL:'https://user@exampleproject.supabase.co'}, {OPS_SUPABASE_PUBLISHABLE_KEY:'sb_secret_test'},
  {OPS_ADMIN_SUBJECTS:''},{OPS_ADMIN_SUBJECTS:'owner@example.org'},{OPS_ADMIN_SUBJECTS:subject+',invalid'}]) {
  assert.equal(opsIdentityConfiguration({...env,...overrides}),null);
 }
 assert.equal(opsIdentityConfiguration({}),null);
});
test('only a remotely validated allowlisted user with the same live MFA session obtains a nominal principal',async()=>{
 const f=fixture();const principal=await supabaseOpsPrincipal(f);
 assert.deepEqual(principal,{subject,role:'admin',aal:'aal2',auth_source:'supabase_auth_live_session',transitional:false});
 assert.equal(Object.isFrozen(principal),true);
 assert.equal(f.calls.http[0].url,configuration.origin+'/auth/v1/user');
 assert.equal(f.calls.http[0].options.headers.Authorization,f.authorization);
 assert.equal(f.calls.http[0].options.redirect,'error');
 assert.ok(f.calls.http[0].options.signal instanceof AbortSignal);
 const query=f.calls.sql[0];assert.equal(query.query_timeout,5000);
 assert.deepEqual(query.values,[session,subject,new Date(now).toISOString()]);
 for(const check of ['auth.sessions','auth.users','auth.mfa_factors',"s.aal = 'aal2'","f.status = 'verified'",'u.deleted_at is null','u.banned_until','s.not_after','f.id = s.factor_id']) assert.ok(query.text.includes(check),check);
});
test('untrusted, missing, expired, wrong-project and non-MFA claims are rejected before HTTP or database access',async()=>{
 for(const changes of [{aal:'aal1'},{aal:undefined},{sub:'33333333-3333-4333-8333-333333333333'},
  {iss:'https://other.supabase.co/auth/v1'},{aud:'other'},{role:'service_role'}, {session_id:undefined},
  {exp:now/1000},{exp:'9999999999'},{nbf:now/1000+1}]) {
  const f=fixture({changes});assert.equal(await supabaseOpsPrincipal(f),null);assert.equal(f.calls.http.length,0);assert.equal(f.calls.sql.length,0);
 }
 for(const authorization of ['Bearer bad','Bearer '+token({}, {alg:'none'}),'Bearer '+token().repeat(2000),'Basic '+token()]) {
  const f=fixture();f.authorization=authorization;assert.equal(await supabaseOpsPrincipal(f),null);assert.equal(f.calls.http.length,0);
 }
});
test('a forged MFA claim cannot bypass Auth; revoked sessions and factors, wrong users and anonymous users fail closed',async()=>{
 for(const options of [{httpOk:false},{active:false},{user:{id:'different',is_anonymous:false}},
  {user:{id:subject,is_anonymous:true}},{user:{id:subject}}]) {
  const f=fixture(options);assert.equal(await supabaseOpsPrincipal(f),null);
  if(options.httpOk===false||options.user) assert.equal(f.calls.sql.length,0);
 }
 for(const part of ['fetchImpl','pool']) {
  const f=fixture();if(part==='fetchImpl')f.fetchImpl=async()=>{throw Error('private auth failure');};else f.pool.query=async()=>{throw Error('private database failure');};
  assert.equal(await supabaseOpsPrincipal(f),null);
 }
 const f=fixture();f.clock=()=>f.calls.sql.length?now+120000:now;assert.equal(await supabaseOpsPrincipal(f),null,'token expired while checking');
});
test('editable metadata never grants a role; allowlist removal denies the next resolved request',async()=>{
 const f=fixture({user:{id:subject,is_anonymous:false,user_metadata:{role:'admin',aal:'aal2'}}});
 f.configuration={...configuration,adminSubjects:[]};assert.equal(await supabaseOpsPrincipal(f),null);assert.equal(f.calls.http.length,0);
});
test('route resolution preserves legacy restrictions, requires nominal MFA for applications and never queries unmapped routes',async()=>{
 const f=fixture();const request={...f,environment:'staging',method:'GET',route:'/ops/professionals/applications'};
 const allowed=await resolveOpsRequestAuthorization(request);assert.equal(allowed.allowed,true);assert.equal(allowed.principal.transitional,false);
 const denied=await resolveOpsRequestAuthorization({...request,authorization:'Bearer legacy',configuredToken:'legacy'});
 assert.equal(denied.allowed,false);assert.equal(denied.reason,'individual_identity_required_for_moderation_data');assert.equal(f.calls.http.length,1);
 const unknown=await resolveOpsRequestAuthorization({...request,route:'/ops/unknown'});assert.equal(unknown.reason,'unmapped_route');assert.equal(f.calls.http.length,1);
 const disabled=await resolveOpsRequestAuthorization({...request,configuration:null});assert.equal(disabled.allowed,false);
});
