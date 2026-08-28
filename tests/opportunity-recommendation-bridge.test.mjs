import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendFromSituation } from '../opportunity/recommendation-bridge.mjs';

test('debt consolidation explicit intent becomes eligible',()=>{
 const r=recommendFromSituation({category:'Dinero',story:'Tengo varias deudas y quiero reunificar mis deudas.'});
 assert.ok(r.eligible.some(x=>x.id==='DEBT_CONSOLIDATION'));
});

test('loan stays pending until affordability is checked',()=>{
 const r=recommendFromSituation({category:'Dinero',story:'Necesito un prestamo para pagar este mes.'});
 assert.ok(r.pending.some(x=>x.id==='LOAN'&&x.reason==='affordability_check_required'));
 assert.ok(!r.eligible.some(x=>x.id==='LOAN'));
});

test('loan becomes eligible after affordability check',()=>{
 const r=recommendFromSituation({category:'Dinero',story:'Necesito un prestamo para pagar este mes.',affordabilityChecked:true});
 assert.ok(r.eligible.some(x=>x.id==='LOAN'));
});

test('safety override blocks commercial opportunity',()=>{
 const r=recommendFromSituation({category:'Dinero',story:'Tengo deudas y quiero un prestamo, estoy pensando en quitarme la vida.',affordabilityChecked:true});
 assert.equal(r.commercial_action_allowed,false);
 assert.equal(r.eligible.length,0);
 assert.ok(r.blocked.some(x=>x.reason==='safety_gate'));
});

test('loneliness does not infer matchmaking',()=>{
 const r=recommendFromSituation({category:'Soledad',story:'Estoy solo y no tengo amigos desde que me mude.'});
 assert.ok(!r.eligible.some(x=>x.id==='MATCHMAKING'));
});

test('explicit matchmaking can be considered',()=>{
 const r=recommendFromSituation({category:'Soledad',story:'Estoy buscando una agencia de citas para encontrar pareja.'});
 assert.ok(r.eligible.some(x=>x.id==='MATCHMAKING'));
});
