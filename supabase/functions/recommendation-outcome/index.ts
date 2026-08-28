import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL=Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const allowedOrigins=new Set(['https://desgracias.es','https://www.desgracias.es','https://andresvalledelacruz.github.io']);
const allowedOutcomes=new Set(['clicked','used_resource','helpful','not_helpful','no_action']);
const allowedKinds=new Set(['official_resource','free_action','own_content','partner']);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cors(origin:string|null){
  const o=origin&&allowedOrigins.has(origin)?origin:'https://desgracias.es';
  return {
    'Access-Control-Allow-Origin':o,
    'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Vary':'Origin',
    'Cache-Control':'no-store'
  };
}

function reply(status:number,body:Record<string,unknown>,origin:string|null){
  return new Response(JSON.stringify(body),{
    status,
    headers:{...cors(origin),'content-type':'application/json; charset=utf-8','x-content-type-options':'nosniff'}
  });
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get('origin');
  if(req.method==='OPTIONS'){
    if(origin&&!allowedOrigins.has(origin)) return reply(403,{error:'origin_not_allowed'},origin);
    return new Response(null,{status:204,headers:cors(origin)});
  }
  if(req.method!=='POST') return reply(405,{error:'method_not_allowed'},origin);
  if(origin&&!allowedOrigins.has(origin)) return reply(403,{error:'origin_not_allowed'},origin);

  const auth=req.headers.get('authorization')||'';
  if(!auth.toLowerCase().startsWith('bearer ')) return reply(401,{error:'authentication_required'},origin);
  const token=auth.slice(7).trim();
  if(!token) return reply(401,{error:'authentication_required'},origin);

  const raw=await req.text();
  if(raw.length>2500) return reply(413,{error:'payload_too_large'},origin);

  let body:any;
  try{body=JSON.parse(raw);}catch{return reply(400,{error:'invalid_json'},origin);}

  const decisionRef=String(body.decisionId||'').trim();
  const eventRef=String(body.eventRef||'').trim();
  const outcomeType=String(body.outcomeType||'').trim();
  const recommendationKind=String(body.recommendationKind||'').trim();
  const recommendationId=body.recommendationId==null?null:String(body.recommendationId).trim().slice(0,240);
  const opportunityId=body.opportunityId==null?null:String(body.opportunityId).trim().slice(0,80);

  if(!decisionRef||decisionRef.length>100||!uuid.test(eventRef)||!allowedOutcomes.has(outcomeType)||!allowedKinds.has(recommendationKind)) {
    return reply(400,{error:'invalid_outcome'},origin);
  }

  const admin=createClient(SUPABASE_URL,SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:userData,error:userError}=await admin.auth.getUser(token);
  if(userError||!userData.user) return reply(401,{error:'invalid_session'},origin);

  const cutoff=new Date(Date.now()-7*24*60*60*1000).toISOString();
  const {data:decision,error:decisionError}=await admin
    .from('recommendation_decisions')
    .select('id,decision_ref,created_at,eligible_opportunities,recommendation_kinds,safety_override')
    .eq('decision_ref',decisionRef)
    .gte('created_at',cutoff)
    .maybeSingle();

  if(decisionError||!decision) return reply(404,{error:'decision_not_found'},origin);
  if(!Array.isArray(decision.recommendation_kinds)||!decision.recommendation_kinds.includes(recommendationKind)) {
    return reply(400,{error:'recommendation_kind_not_in_decision'},origin);
  }
  if(opportunityId&&(!Array.isArray(decision.eligible_opportunities)||!decision.eligible_opportunities.includes(opportunityId))) {
    return reply(400,{error:'opportunity_not_eligible'},origin);
  }
  if(decision.safety_override&&recommendationKind==='partner') {
    return reply(400,{error:'commercial_outcome_blocked_by_safety'},origin);
  }

  const {count,error:countError}=await admin
    .from('recommendation_outcomes')
    .select('id',{count:'exact',head:true})
    .eq('decision_id',decision.id);
  if(countError) return reply(500,{error:'outcome_check_failed'},origin);
  if((count||0)>=20) return reply(429,{error:'decision_event_limit'},origin);

  const row={
    decision_id:decision.id,
    event_ref:eventRef,
    outcome_type:outcomeType,
    recommendation_kind:recommendationKind,
    recommendation_id:recommendationId||null,
    opportunity_id:opportunityId||null,
    partner_id:null,
    value:null,
    currency:null,
    metadata:{source:'next_step_ui',schema:1}
  };

  const {error:insertError}=await admin.from('recommendation_outcomes').insert(row);
  if(insertError){
    if(String(insertError.code)==='23505') return reply(200,{ok:true,deduplicated:true},origin);
    return reply(500,{error:'outcome_persistence_failed'},origin);
  }
  return reply(200,{ok:true,deduplicated:false},origin);
});
