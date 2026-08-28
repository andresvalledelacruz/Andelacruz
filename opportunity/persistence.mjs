const pick=(obj,keys)=>Object.fromEntries(keys.filter(k=>obj[k]!==undefined).map(k=>[k,obj[k]]));

export function decisionRecordToRow(record={}){
 return Object.freeze({
  decision_ref:record.decisionId,
  created_at:record.createdAt,
  page_path:record.pagePath||null,
  territory:record.territory||'ES',
  category:record.category||null,
  safety_override:Boolean(record.safetyOverride),
  primary_route:record.primaryRoute||null,
  detected_routes:record.detectedRoutes||[],
  explicit_intents:record.explicitIntents||[],
  negation_present:Boolean(record.negationPresent),
  eligible_opportunities:record.eligible||[],
  pending_opportunities:record.pending||[],
  blocked_opportunities:record.blocked||[],
  primary_recommendation:record.primaryRecommendation||null,
  recommendation_kinds:record.recommendationKinds||[],
  commercial_suppressed:Boolean(record.commercialSuppressed),
  decision_reason:record.decisionReason||null,
  engine_version:Number(record.version)||1
 });
}

export function outcomeEventToRow(event={},decisionUuid){
 if(!decisionUuid) throw new Error('Missing decision UUID');
 return Object.freeze({
  decision_id:decisionUuid,
  created_at:event.createdAt,
  outcome_type:event.type,
  recommendation_kind:event.recommendationKind||null,
  recommendation_id:event.recommendationId||null,
  opportunity_id:event.opportunityId||null,
  partner_id:event.partnerId||null,
  value:Number.isFinite(event.value)?event.value:null,
  currency:event.currency||null,
  metadata:event.metadata||{}
 });
}

export function learningSignalToRow(opportunityId,signal={},window={}){
 if(!opportunityId) throw new Error('Missing opportunityId');
 return Object.freeze({
  opportunity_id:opportunityId,
  sample_size:Number(signal.sampleSize)||0,
  outcome_score:Number(signal.outcomeScore)||0,
  confidence:Number(signal.confidence)||0,
  status:signal.status||'early',
  source_window_start:window.start||null,
  source_window_end:window.end||null
 });
}

export function safePersistenceEnvelope({decision,outcome,learning}={}){
 return Object.freeze(pick({decision,outcome,learning},['decision','outcome','learning']));
}
