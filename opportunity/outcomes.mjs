const OUTCOME_TYPES = Object.freeze(['no_action','viewed','clicked','used_resource','consented','lead','converted','helpful','not_helpful']);
const FORBIDDEN = new Set(['story','message','free_text','name','email','phone','dni','address','account','card','contract','ip','userId','user_id']);

function cleanMetadata(metadata={}){
 const out={};
 for(const [key,value] of Object.entries(metadata)){
  if(FORBIDDEN.has(key)||FORBIDDEN.has(key.toLowerCase())) continue;
  if(typeof value==='string'&&value.length>160) out[key]=value.slice(0,160); else out[key]=value;
 }
 return out;
}

export function createOutcomeEvent(input={}){
 if(!OUTCOME_TYPES.includes(input.type)) throw new Error('Invalid outcome type');
 if(!input.decisionId) throw new Error('Missing decisionId');
 return Object.freeze({
  version:1,
  decisionId:input.decisionId,
  type:input.type,
  recommendationKind:input.recommendationKind||null,
  recommendationId:input.recommendationId||null,
  opportunityId:input.opportunityId||null,
  partnerId:input.partnerId||null,
  value:Number.isFinite(input.value)?input.value:null,
  currency:input.currency||null,
  metadata:Object.freeze(cleanMetadata(input.metadata||{})),
  createdAt:input.createdAt||new Date().toISOString()
 });
}

const POSITIVE = Object.freeze({viewed:0.15,clicked:0.35,used_resource:0.55,consented:0.65,lead:0.80,converted:1,helpful:0.75});
const NEGATIVE = Object.freeze({no_action:-0.10,not_helpful:-0.65});

export function scoreOutcome(event={}){
 if(POSITIVE[event.type]!==undefined) return POSITIVE[event.type];
 if(NEGATIVE[event.type]!==undefined) return NEGATIVE[event.type];
 return 0;
}

export function aggregateOutcomes(events=[]){
 const byOpportunity=new Map();
 const byRecommendationKind=new Map();
 for(const event of events){
  const score=scoreOutcome(event);
  if(event.opportunityId){
   const current=byOpportunity.get(event.opportunityId)||{count:0,totalScore:0,converted:0,helpful:0};
   current.count++; current.totalScore+=score;
   if(event.type==='converted') current.converted++;
   if(event.type==='helpful') current.helpful++;
   byOpportunity.set(event.opportunityId,current);
  }
  if(event.recommendationKind){
   const current=byRecommendationKind.get(event.recommendationKind)||{count:0,totalScore:0};
   current.count++; current.totalScore+=score;
   byRecommendationKind.set(event.recommendationKind,current);
  }
 }
 const normalize=map=>Object.fromEntries([...map.entries()].map(([id,v])=>[id,{...v,averageScore:Number((v.totalScore/Math.max(1,v.count)).toFixed(3))}]));
 return Object.freeze({total:events.length,byOpportunity:Object.freeze(normalize(byOpportunity)),byRecommendationKind:Object.freeze(normalize(byRecommendationKind))});
}

export function learningSignals(aggregate={}){
 const signals={};
 for(const [opportunityId,stats] of Object.entries(aggregate.byOpportunity||{})){
  const sample=Math.min(1,stats.count/50);
  const normalized=Math.max(-1,Math.min(1,stats.averageScore));
  signals[opportunityId]=Object.freeze({
   outcomeScore:Number((normalized*100).toFixed(2)),
   confidence:Number((sample*0.8).toFixed(2)),
   sampleSize:stats.count,
   status:stats.count>=50?'measured':stats.count>=10?'partial':'early'
  });
 }
 return Object.freeze(signals);
}
