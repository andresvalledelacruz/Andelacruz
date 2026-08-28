import { routeSituation } from '../src/situation-router.js';
import { evaluateOpportunity } from './engine.mjs';
import { OPPORTUNITIES, MONETIZATION } from './registry.mjs';

const TOPIC_TO_OPPORTUNITY=Object.freeze({debt_consolidation:'DEBT_CONSOLIDATION',loan:'LOAN',psychologist:'PSYCHOLOGY',couples_therapy:'COUPLES_THERAPY',lawyer:'LEGAL_LABOR',cv:'CV_SERVICE',interview:'INTERVIEW_COACHING',training:'TRAINING',matchmaking:'MATCHMAKING',social_activity:'SOCIAL_ACTIVITIES'});

function deriveNeeds(situation){
 const needs=new Set();
 const ids=new Set(situation.needs.map(x=>x.id));
 if(ids.has('financial_practical')) needs.add('debt_advice');
 if(ids.has('work_career')) needs.add('find_job');
 if(ids.has('legal_mediation')) needs.add('labor_legal');
 if(ids.has('clinical_review')) needs.add('psychological_support');
 if(ids.has('relationship_family')) needs.add('couples_support');
 if(ids.has('social_community')) needs.add('social_activity');
 for(const topic of situation.intent_context.topics){
  if(topic.id==='cv') needs.add('cv_help');
  if(topic.id==='interview') needs.add('interview_help');
  if(topic.id==='training') needs.add('training_gap');
 }
 return [...needs];
}

function deriveIntents(situation){
 return situation.intent_context.explicit_commercial_intent.map(x=>TOPIC_TO_OPPORTUNITY[x]).filter(Boolean);
}

function deriveFlags(situation,input){
 const flags=new Set(input.flags||[]);
 if(situation.safety_override) flags.add('critical_safety');
 if(input.affordabilityChecked===true) flags.add('affordability_checked');
 if(input.marketEvidence===true) flags.add('market_evidence');
 return [...flags];
}

export function recommendFromSituation(input={}){
 const situation=routeSituation(input);
 const needs=deriveNeeds(situation);
 const intents=deriveIntents(situation);
 const flags=deriveFlags(situation,input);
 const evaluation=evaluateOpportunity({needs,intents,flags});
 const explicit=new Set(intents);
 const eligible=evaluation.opportunities.map(o=>Object.freeze({...o,status:'eligible',explicit_intent:explicit.has(o.id)}));
 const pending=[];
 for(const id of intents){
  if(eligible.some(x=>x.id===id)) continue;
  const def=OPPORTUNITIES[id];
  if(!def) continue;
  let reason='requirements_not_met';
  if(def.affordabilityRequired&&!flags.includes('affordability_checked')) reason='affordability_check_required';
  if(def.requiresEvidence&&!flags.includes('market_evidence')) reason='market_evidence_required';
  pending.push(Object.freeze({id,status:'pending_context',reason,risk:def.risk}));
 }
 const blocked=[];
 if(situation.safety_override){
  for(const id of intents) blocked.push(Object.freeze({id,status:'blocked',reason:'safety_gate'}));
 }
 if(situation.intent_context.negation.present){
  for(const topic of situation.intent_context.topics){
   const id=TOPIC_TO_OPPORTUNITY[topic.id];
   if(id&&!blocked.some(x=>x.id===id)) blocked.push(Object.freeze({id,status:'blocked',reason:'explicit_negation'}));
  }
 }
 return Object.freeze({version:1,situation,monetization:evaluation.monetization,eligible:Object.freeze(eligible),pending:Object.freeze(pending),blocked:Object.freeze(blocked),derived:Object.freeze({needs,intents,flags}),reason:evaluation.reason,commercial_action_allowed:situation.commercial_allowed&&evaluation.monetization!==MONETIZATION.OFF});
}
