import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreCandidate } from '../opportunity/scoring.mjs';
import { recommendNextBestActions } from '../opportunity/recommendation-engine.mjs';

test('candidate scoring ignores outcome learning below sample threshold',()=>{
 const candidate={id:'x',slug:'/x/',title:'X',domain:'test',userValue:80,seoValue:60,commercialValue:60,strategicFit:80,risk:'low',confidence:.6,commercialPolicy:'standard',opportunities:['JOB_SEARCH']};
 const a=scoreCandidate(candidate,undefined,{},{});
 const b=scoreCandidate(candidate,undefined,{}, {sampleSize:5,outcomeScore:100,confidence:.8});
 assert.equal(a.score,b.score);
});

test('candidate scoring applies bounded positive learning',()=>{
 const candidate={id:'x',slug:'/x/',title:'X',domain:'test',userValue:80,seoValue:60,commercialValue:60,strategicFit:80,risk:'low',confidence:.6,commercialPolicy:'standard',opportunities:['JOB_SEARCH']};
 const r=scoreCandidate(candidate,undefined,{}, {sampleSize:100,outcomeScore:100,confidence:1});
 assert.ok(r.learning.adjustment<=3);
 assert.ok(r.score>=r.preLearningScore);
});

test('negative learning can lower candidate score',()=>{
 const candidate={id:'x',slug:'/x/',title:'X',domain:'test',userValue:80,seoValue:0,commercialValue:0,strategicFit:80,risk:'low',confidence:.6,commercialPolicy:'off',opportunities:['JOB_SEARCH']};
 const r=scoreCandidate(candidate,undefined,{}, {sampleSize:100,outcomeScore:-100,confidence:1});
 assert.equal(r.learning.adjustment,-12);
 assert.ok(r.score<r.preLearningScore);
});

test('partner learning cannot overtake official/free hierarchy with max boost',()=>{
 const registry=[{id:'p1',name:'Partner',opportunities:['DEBT_CONSOLIDATION'],territories:['ES'],status:'active',verification:'verified',disclosure:'Publicidad'}];
 const r=recommendNextBestActions({category:'Dinero',story:'Tengo varias deudas y quiero reunificarlas.'},{registry,learningSignals:{DEBT_CONSOLIDATION:{sampleSize:100,outcomeScore:100,confidence:1}}});
 assert.notEqual(r.primary_recommendation.kind,'partner');
 const partner=r.recommendations.find(x=>x.kind==='partner');
 assert.ok(partner.learningAdjustment<=3);
});

test('safety path never applies commercial learning',()=>{
 const registry=[{id:'p1',name:'Partner',opportunities:['LOAN'],territories:['ES'],status:'active',verification:'verified'}];
 const r=recommendNextBestActions({category:'Dinero',story:'Necesito un prestamo y estoy pensando en quitarme la vida.',affordabilityChecked:true},{registry,learningSignals:{LOAN:{sampleSize:100,outcomeScore:100,confidence:1}}});
 assert.equal(r.commercial_suppressed,true);
 assert.ok(r.recommendations.every(x=>x.kind!=='partner'));
});
