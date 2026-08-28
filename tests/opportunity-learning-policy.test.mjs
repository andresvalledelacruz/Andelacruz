import test from 'node:test';
import assert from 'node:assert/strict';
import { applyLearningPolicy,auditLearningAdjustment,learningAdjustedScore } from '../opportunity/learning-policy.mjs';

test('small samples cannot alter decisions',()=>{const r=applyLearningPolicy({userValue:80},{sampleSize:4,outcomeScore:100,confidence:.8});assert.equal(r.learningAdjustment,0);});
test('positive measured outcomes receive bounded boost',()=>{const r=applyLearningPolicy({userValue:80,commercial:false},{sampleSize:60,outcomeScore:80,confidence:.8});assert.ok(r.learningAdjustment>0&&r.learningAdjustment<=8);});
test('commercial recommendations have tighter boost cap',()=>{const r=applyLearningPolicy({userValue:90,commercial:true},{sampleSize:100,outcomeScore:100,confidence:1});assert.equal(r.learningAdjustment,3);});
test('low user value cannot be rescued by conversion performance',()=>{const r=applyLearningPolicy({userValue:30,commercial:true},{sampleSize:100,outcomeScore:100,confidence:1});assert.equal(r.learningAdjustment,0);});
test('negative outcomes can penalize more than positive outcomes boost',()=>{const r=applyLearningPolicy({userValue:80},{sampleSize:100,outcomeScore:-100,confidence:1});assert.equal(r.learningAdjustment,-12);});
test('adjusted score remains bounded and auditable',()=>{const base={userValue:80,commercial:true};const r=applyLearningPolicy(base,{sampleSize:100,outcomeScore:100,confidence:1});assert.equal(learningAdjustedScore(99,r),100);assert.equal(auditLearningAdjustment(base,r).ok,true);});
