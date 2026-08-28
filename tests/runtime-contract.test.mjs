import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRuntimeDecision, buildDecisionRow, publicRuntimeResponse } from '../opportunity/runtime-contract.mjs';

test('runtime contract uses full recommendation engine',()=>{
 const result=buildRuntimeDecision({category:'Dinero',story:'Tengo varias deudas y quiero reunificarlas'});
 assert.ok(result.opportunity_state.eligible.some(x=>x.id==='DEBT_CONSOLIDATION'));
});

test('runtime persistence row matches current schema contract',()=>{
 const result=buildRuntimeDecision({category:'Trabajo',story:'Me han despedido y necesito encontrar trabajo'});
 const row=buildDecisionRow({decisionRef:'abc123',result,input:{category:'Trabajo',pagePath:'/trabajo/'}});
 assert.equal(row.decision_ref,'abc123');
 assert.equal(typeof row.engine_version,'number');
 assert.ok(Array.isArray(row.detected_routes));
 assert.ok(!('story' in row));
 assert.ok(!('email' in row));
});

test('public runtime response explicitly states story is not persisted',()=>{
 const result=buildRuntimeDecision({category:'Soledad',story:'Me mudé y no conozco a nadie'});
 const response=publicRuntimeResponse({decisionRef:'d1',result});
 assert.equal(response.privacy.story_persisted,false);
 assert.equal(response.privacy.direct_identifiers_persisted,false);
});

test('safety remains first in runtime contract',()=>{
 const result=buildRuntimeDecision({category:'Dinero',story:'Tengo deudas y estoy pensando en quitarme la vida'});
 assert.equal(result.situation.safety_override,true);
 assert.equal(result.primary_recommendation.kind,'official_resource');
 assert.equal(result.commercial_suppressed,true);
});
