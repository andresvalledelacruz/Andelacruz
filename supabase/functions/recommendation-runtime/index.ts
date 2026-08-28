import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildRuntimeDecision, buildDecisionRow, publicRuntimeResponse } from 'https://raw.githubusercontent.com/andresvalledelacruz/Andelacruz/aef9791da02f8168215c8a466f5f0bb5e61a3f52/opportunity/runtime-contract.mjs';

const BRAIN_COMMIT='aef9791da02f8168215c8a466f5f0bb5e61a3f52';
const ENGINE_VERSION=3;

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,
  headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'}
});

Deno.serve(async(req)=>{
  if(req.method!=='POST') return json({error:'method_not_allowed'},405);
  const auth=req.headers.get('authorization');
  if(!auth) return json({error:'unauthorized'},401);

  const url=Deno.env.get('SUPABASE_URL')!;
  const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
  const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const {data:{user},error:userError}=await userClient.auth.getUser();
  if(userError||!user) return json({error:'unauthorized'},401);

  let body:any;
  try{body=await req.json();}catch{return json({error:'invalid_json'},400);}

  const story=typeof body.story==='string'?body.story.slice(0,8000):'';
  const title=typeof body.title==='string'?body.title.slice(0,240):'';
  const category=typeof body.category==='string'?body.category.slice(0,80):'';
  if(!story.trim()&&!title.trim()&&!category.trim()) return json({error:'story_title_or_category_required'},400);

  const territory=typeof body.territory==='string'?body.territory.slice(0,12):'ES';
  const safeInput={
    story,title,category,territory,
    pagePath:typeof body.pagePath==='string'?body.pagePath.slice(0,300):null,
    needs:Array.isArray(body.needs)?body.needs.filter((x:any)=>typeof x==='string').slice(0,20):[],
    flags:Array.isArray(body.flags)?body.flags.filter((x:any)=>typeof x==='string').slice(0,20):[],
    affordabilityChecked:body.affordabilityChecked===true,
    marketEvidence:body.marketEvidence===true
  };

  const db=createClient(url,service);
  const {data:snapshots,error:snapshotError}=await db
    .from('opportunity_learning_snapshots')
    .select('opportunity_id,sample_size,outcome_score,confidence,status,snapshot_date,created_at')
    .order('snapshot_date',{ascending:false})
    .order('created_at',{ascending:false})
    .limit(500);

  const learningSignals:Record<string,any>={};
  if(!snapshotError){
    for(const row of snapshots||[]){
      if(!row.opportunity_id||learningSignals[row.opportunity_id]) continue;
      learningSignals[row.opportunity_id]={
        sampleSize:Number(row.sample_size)||0,
        outcomeScore:Number(row.outcome_score)||0,
        confidence:Number(row.confidence)||0,
        status:row.status||'early'
      };
    }
  }

  let result:any;
  try{result=buildRuntimeDecision(safeInput,{territory,learningSignals});}
  catch{return json({error:'recommendation_failed'},500);}

  const decisionRef=crypto.randomUUID();
  const row=buildDecisionRow({
    decisionRef,
    result,
    input:safeInput,
    engineVersion:ENGINE_VERSION,
    brainCommit:BRAIN_COMMIT
  });
  const {error:persistError}=await db.from('recommendation_decisions').insert(row);
  if(persistError) return json({error:'persistence_failed'},500);

  return json(publicRuntimeResponse({decisionRef,result,brainCommit:BRAIN_COMMIT}));
});
