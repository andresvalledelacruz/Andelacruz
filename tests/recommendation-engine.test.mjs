import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendNextBestActions } from '../opportunity/recommendation-engine.mjs';
import { registerPartner, PARTNER_STATUS } from '../opportunity/partners.mjs';

test('safety puts official resource first and suppresses commercial',()=>{
 const r=recommendNextBestActions({category:'Dinero',story:'Tengo deudas y estoy pensando en quitarme la vida.'});
 assert.equal(r.reason,'safety_first');
 assert.equal(r.commercial_suppressed,true);
 assert.equal(r.primary_recommendation.kind,'official_resource');
});

test('financial situation prefers official/free help before partner',()=>{
 const partner=registerPartner({id:'p1',name:'Partner',opportunities:['DEBT_CONSOLIDATION'],territories:['ES'],status:PARTNER_STATUS.ACTIVE,verification:'verified'});
 const r=recommendNextBestActions({category:'Dinero',story:'Tengo varias deudas y quiero reunificarlas.'},{registry:[partner]});
 assert.notEqual(r.primary_recommendation.kind,'partner');
 assert.ok(r.recommendations.some(x=>x.kind==='partner'));
});

test('unverified partner is never recommended',()=>{
 const partner=registerPartner({id:'p2',name:'Draft Partner',opportunities:['DEBT_CONSOLIDATION'],territories:['ES'],status:PARTNER_STATUS.ACTIVE,verification:'pending'});
 const r=recommendNextBestActions({category:'Dinero',story:'Tengo varias deudas y quiero reunificarlas.'},{registry:[partner]});
 assert.ok(!r.recommendations.some(x=>x.kind==='partner'));
});

test('loneliness gets own/support content without automatic commercial partner',()=>{
 const r=recommendNextBestActions({category:'Soledad',story:'Estoy solo y no tengo amigos desde que me mudé.'});
 assert.ok(r.recommendations.some(x=>x.kind==='own_content'));
 assert.ok(!r.recommendations.some(x=>x.kind==='partner'));
});

test('loan pending affordability does not generate partner recommendation',()=>{
 const partner=registerPartner({id:'p3',name:'Loan Partner',opportunities:['LOAN'],territories:['ES'],status:PARTNER_STATUS.ACTIVE,verification:'verified'});
 const r=recommendNextBestActions({category:'Dinero',story:'Necesito un prestamo este mes.'},{registry:[partner]});
 assert.ok(!r.recommendations.some(x=>x.opportunityId==='LOAN'));
});
