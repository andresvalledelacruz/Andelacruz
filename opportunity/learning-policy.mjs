export const DEFAULT_LEARNING_POLICY=Object.freeze({minSample:10,measuredSample:50,maxBoost:8,maxPenalty:12,commercialMaxBoost:3,helpfulnessFloor:0,userValueFloor:55});

const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||0));

export function applyLearningPolicy(base={},signal={},policy=DEFAULT_LEARNING_POLICY){
 const sample=Number(signal.sampleSize)||0;
 if(sample<policy.minSample) return Object.freeze({...base,learningAdjustment:0,learningStatus:'insufficient_sample'});
 const outcome=clamp(signal.outcomeScore,-100,100);
 const confidence=clamp(signal.confidence,0,1);
 let adjustment=outcome>=0 ? (outcome/100)*policy.maxBoost*confidence : (outcome/100)*policy.maxPenalty*confidence;
 if(base.commercial===true && adjustment>policy.commercialMaxBoost) adjustment=policy.commercialMaxBoost;
 if((Number(base.userValue)||100)<policy.userValueFloor && adjustment>0) adjustment=0;
 if(outcome<policy.helpfulnessFloor && adjustment>0) adjustment=0;
 adjustment=Number(adjustment.toFixed(2));
 return Object.freeze({...base,learningAdjustment:adjustment,learningStatus:sample>=policy.measuredSample?'measured':'partial'});
}

export function learningAdjustedScore(baseScore,policyResult={}){
 return Number(clamp((Number(baseScore)||0)+(Number(policyResult.learningAdjustment)||0),0,100).toFixed(2));
}

export function auditLearningAdjustment(base={},result={},policy=DEFAULT_LEARNING_POLICY){
 const issues=[];
 if(result.learningAdjustment>policy.maxBoost) issues.push('boost_exceeds_cap');
 if(result.learningAdjustment<(-policy.maxPenalty)) issues.push('penalty_exceeds_cap');
 if(base.commercial===true&&result.learningAdjustment>policy.commercialMaxBoost) issues.push('commercial_boost_exceeds_cap');
 if((Number(base.userValue)||100)<policy.userValueFloor&&result.learningAdjustment>0) issues.push('low_user_value_boosted');
 return Object.freeze({ok:issues.length===0,issues:Object.freeze(issues)});
}
