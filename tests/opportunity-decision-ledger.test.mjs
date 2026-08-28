import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendNextBestActions } from '../opportunity/recommendation-engine.mjs';
import { createDecisionRecord, auditDecision, summarizeLedger } from '../opportunity/decision-ledger.mjs';

test('ledger records decision without storing story or direct identifiers',()=>{
 const input={category:'Dinero',story:'Debo dinero y quiero reunificar mis deudas',name:'Persona',email:'x@example.com',pagePath:'/dinero/'};
 const result=recommendNextBestActions(input);
 const record=createDecisionRecord({input,result,createdAt:'2026-08-28T06:30:00.000Z'});
 const serialized=JSON.stringify(record);
 assert.ok(!serialized.includes('Debo dinero'));
 assert.ok(!serialized.includes('x@example.com'));
 assert.ok(!serialized.includes('Persona'));
 assert.ok(record.decisionId);
});

test('normal decision passes audit',()=>{
 const result=recommendNextBestActions({category:'Soledad',story:'Me he mudado y no conozco a nadie'});
 const record=createDecisionRecord({input:{category:'Soledad'},result});
 assert.equal(auditDecision(record).ok,true);
});

test('audit catches commercial recommendation during safety override',()=>{
 const bad={safetyOverride:true,commercialSuppressed:false,primaryRecommendation:{kind:'partner',commercial:true},blocked:[],eligible:[]};
 const audit=auditDecision(bad);
 assert.equal(audit.ok,false);
 assert.ok(audit.issues.includes('commercial_primary_during_safety_override'));
});

test('ledger summary counts primary recommendation types',()=>{
 const a={primaryRecommendation:{kind:'own_content'},safetyOverride:false,commercialSuppressed:false};
 const b={primaryRecommendation:{kind:'official_resource'},safetyOverride:true,commercialSuppressed:true};
 const s=summarizeLedger([a,b]);
 assert.equal(s.total,2);
 assert.equal(s.safetyOverrides,1);
 assert.equal(s.byPrimaryKind.official_resource,1);
});
