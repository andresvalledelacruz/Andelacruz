import { recommendNextBestActions } from './recommendation-engine.mjs';

export function buildRuntimeDecision(input={},options={}){
  return recommendNextBestActions(input,options);
}

export function buildDecisionRow({decisionRef,result,input={},engineVersion=2,brainCommit=null}={}){
  if(!decisionRef) throw new Error('Missing decisionRef');
  const situation=result?.situation||{};
  const opportunity=result?.opportunity_state||{};
  const recommendations=result?.recommendations||[];
  return Object.freeze({
    decision_ref:String(decisionRef),
    page_path:input.pagePath||null,
    territory:input.territory||'ES',
    category:input.category||null,
    safety_override:Boolean(situation.safety_override),
    primary_route:situation.primary?.id||null,
    detected_routes:(situation.needs||[]).map(x=>x.id),
    explicit_intents:situation.intent_context?.explicit_commercial_intent||[],
    negation_present:Boolean(situation.intent_context?.negation?.present),
    eligible_opportunities:(opportunity.eligible||[]).map(x=>x.id),
    pending_opportunities:(opportunity.pending||[]).map(x=>({id:x.id,reason:x.reason})),
    blocked_opportunities:(opportunity.blocked||[]).map(x=>({id:x.id,reason:x.reason})),
    primary_recommendation:result?.primary_recommendation?{
      kind:result.primary_recommendation.kind,
      id:result.primary_recommendation.id||result.primary_recommendation.path||result.primary_recommendation.partnerId||null,
      commercial:Boolean(result.primary_recommendation.commercial)
    }:null,
    recommendation_kinds:recommendations.map(x=>x.kind),
    commercial_suppressed:Boolean(result?.commercial_suppressed),
    decision_reason:result?.reason||null,
    engine_version:Number(engineVersion),
    brain_commit:brainCommit?String(brainCommit):null
  });
}

export function publicRuntimeResponse({decisionRef,result,brainCommit=null}={}){
  return Object.freeze({
    version:2,
    decisionId:decisionRef,
    brainCommit,
    situation:result?.situation||null,
    opportunity_state:result?.opportunity_state||null,
    primary_recommendation:result?.primary_recommendation||null,
    recommendations:result?.recommendations||[],
    commercial_suppressed:Boolean(result?.commercial_suppressed),
    learning_applied:Boolean(result?.learning_applied),
    reason:result?.reason||null,
    privacy:Object.freeze({story_persisted:false,direct_identifiers_persisted:false})
  });
}
