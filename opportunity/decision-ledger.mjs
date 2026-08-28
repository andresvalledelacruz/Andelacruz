import { createHash } from 'node:crypto';

const FORBIDDEN = new Set(['story','message','free_text','name','email','phone','dni','address','account','card','contract','ip','userId','user_id']);

function sanitize(value){
 if(Array.isArray(value)) return value.map(sanitize);
 if(value && typeof value==='object'){
  const out={};
  for(const [key,val] of Object.entries(value)){
   if(FORBIDDEN.has(key)||FORBIDDEN.has(key.toLowerCase())) continue;
   out[key]=sanitize(val);
  }
  return out;
 }
 if(typeof value==='string' && value.length>240) return value.slice(0,240);
 return value;
}

function stableId(payload){
 return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0,24);
}

export function createDecisionRecord({input={},result={},createdAt=new Date().toISOString()}={}){
 const situation=result.situation||{};
 const opportunity=result.opportunity_state||{};
 const recommendations=result.recommendations||[];
 const record=sanitize({
  version:1,
  createdAt,
  pagePath:input.pagePath||null,
  territory:input.territory||'ES',
  category:input.category||null,
  safetyOverride:Boolean(situation.safety_override),
  primaryRoute:situation.primary?.id||null,
  detectedRoutes:(situation.needs||[]).map(x=>x.id),
  explicitIntents:situation.intent_context?.explicit_commercial_intent||[],
  negationPresent:Boolean(situation.intent_context?.negation?.present),
  eligible:(opportunity.eligible||[]).map(x=>x.id),
  pending:(opportunity.pending||[]).map(x=>({id:x.id,reason:x.reason})),
  blocked:(opportunity.blocked||[]).map(x=>({id:x.id,reason:x.reason})),
  primaryRecommendation:result.primary_recommendation?{kind:result.primary_recommendation.kind,id:result.primary_recommendation.id||result.primary_recommendation.path||result.primary_recommendation.partnerId||null,commercial:Boolean(result.primary_recommendation.commercial)}:null,
  recommendationKinds:recommendations.map(x=>x.kind),
  commercialSuppressed:Boolean(result.commercial_suppressed),
  decisionReason:result.reason||null
 });
 return Object.freeze({decisionId:stableId(record),...record});
}

export function auditDecision(record={}){
 const issues=[];
 if(record.safetyOverride && record.primaryRecommendation?.commercial) issues.push('commercial_primary_during_safety_override');
 if(record.safetyOverride && record.commercialSuppressed!==true) issues.push('commercial_not_suppressed_during_safety_override');
 if(record.primaryRecommendation?.kind==='partner' && record.primaryRecommendation?.commercial!==true) issues.push('partner_not_marked_commercial');
 if((record.blocked||[]).some(x=>record.eligible?.includes(x.id))) issues.push('opportunity_both_blocked_and_eligible');
 return Object.freeze({ok:issues.length===0,issues:Object.freeze(issues)});
}

export function summarizeLedger(records=[]){
 const byPrimaryKind={}; let safety=0, commercialSuppressed=0;
 for(const r of records){
  const kind=r.primaryRecommendation?.kind||'none'; byPrimaryKind[kind]=(byPrimaryKind[kind]||0)+1;
  if(r.safetyOverride) safety++;
  if(r.commercialSuppressed) commercialSuppressed++;
 }
 return Object.freeze({total:records.length,safetyOverrides:safety,commercialSuppressed,byPrimaryKind:Object.freeze(byPrimaryKind)});
}
