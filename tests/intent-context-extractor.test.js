import test from 'node:test';
import assert from 'node:assert/strict';
import { extractIntentContext } from '../src/intent-context-extractor.js';

test('detects explicit debt consolidation intent',()=>{
 const r=extractIntentContext({story:'Tengo varias deudas y quiero reunificarlas porque me han ofrecido una cuota menor.'});
 assert.ok(r.explicit_commercial_intent.includes('debt_consolidation'));
 assert.equal(r.has_received_offer,true);
});

test('negation blocks explicit commercial intent',()=>{
 const r=extractIntentContext({story:'Tengo deudas pero no quiero pedir un préstamo.'});
 assert.equal(r.negation.present,true);
 assert.ok(!r.explicit_commercial_intent.includes('loan'));
});

test('detects immediate urgency separately from commercial intent',()=>{
 const r=extractIntentContext({story:'Necesito dinero urgente hoy para pagar una factura.'});
 assert.equal(r.urgency.level,'immediate');
 assert.ok(r.intents.some(x=>x.id==='need'));
});

test('does not infer matchmaking from loneliness alone',()=>{
 const r=extractIntentContext({story:'Estoy solo desde que me mudé y no tengo amigos.'});
 assert.ok(!r.explicit_commercial_intent.includes('matchmaking'));
});

test('detects prior attempts',()=>{
 const r=extractIntentContext({story:'He probado varios cursos y sigo sin encontrar trabajo.'});
 assert.equal(r.has_prior_attempt,true);
});
