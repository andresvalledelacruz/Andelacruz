import test from 'node:test';
import assert from 'node:assert/strict';
import { decisionRecordToRow,outcomeEventToRow,learningSignalToRow } from '../opportunity/persistence.mjs';

test('decision adapter only emits structured fields',()=>{
 const row=decisionRecordToRow({decisionId:'abc',createdAt:'2026-08-28T00:00:00Z',story:'secret',email:'x@y.com',detectedRoutes:['financial_practical']});
 const s=JSON.stringify(row);
 assert.equal(row.decision_ref,'abc');
 assert.ok(!s.includes('secret'));
 assert.ok(!s.includes('x@y.com'));
});

test('outcome adapter requires database decision uuid',()=>{
 assert.throws(()=>outcomeEventToRow({type:'clicked'}));
 const row=outcomeEventToRow({type:'clicked',metadata:{}},'00000000-0000-0000-0000-000000000001');
 assert.equal(row.outcome_type,'clicked');
});

test('learning adapter maps bounded signal',()=>{
 const row=learningSignalToRow('JOB_SEARCH',{sampleSize:20,outcomeScore:30,confidence:.32,status:'partial'});
 assert.equal(row.opportunity_id,'JOB_SEARCH');
 assert.equal(row.sample_size,20);
});
