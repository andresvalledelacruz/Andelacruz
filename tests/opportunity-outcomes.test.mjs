import test from 'node:test';
import assert from 'node:assert/strict';
import { createOutcomeEvent, scoreOutcome, aggregateOutcomes, learningSignals } from '../opportunity/outcomes.mjs';

test('outcome event strips direct identifiers and free text',()=>{
 const e=createOutcomeEvent({decisionId:'abc',type:'clicked',opportunityId:'CV_SERVICE',metadata:{email:'x@example.com',story:'texto privado',placement:'sidebar'}});
 const s=JSON.stringify(e);
 assert.ok(!s.includes('x@example.com'));
 assert.ok(!s.includes('texto privado'));
 assert.equal(e.metadata.placement,'sidebar');
});

test('positive and negative outcomes have directional scores',()=>{
 assert.ok(scoreOutcome({type:'converted'})>scoreOutcome({type:'clicked'}));
 assert.ok(scoreOutcome({type:'not_helpful'})<0);
});

test('aggregate outcomes groups by opportunity',()=>{
 const events=[
  createOutcomeEvent({decisionId:'1',type:'clicked',opportunityId:'CV_SERVICE'}),
  createOutcomeEvent({decisionId:'2',type:'converted',opportunityId:'CV_SERVICE'}),
  createOutcomeEvent({decisionId:'3',type:'not_helpful',opportunityId:'TRAINING'})
 ];
 const a=aggregateOutcomes(events);
 assert.equal(a.byOpportunity.CV_SERVICE.count,2);
 assert.equal(a.byOpportunity.CV_SERVICE.converted,1);
});

test('learning signals remain low confidence with tiny samples',()=>{
 const events=[createOutcomeEvent({decisionId:'1',type:'converted',opportunityId:'CV_SERVICE'})];
 const signals=learningSignals(aggregateOutcomes(events));
 assert.equal(signals.CV_SERVICE.status,'early');
 assert.ok(signals.CV_SERVICE.confidence<0.1);
});
