import test from 'node:test';
import assert from 'node:assert/strict';
import { routeSituation } from '../src/situation-router.js';

test('routes dismissal plus debt plus sleep difficulty as multiple needs',()=>{
 const r=routeSituation({category:'Trabajo',title:'Me han despedido',story:'Me han despedido, tengo deudas y no duermo por el estrés.'});
 const ids=r.needs.map(x=>x.id);
 assert.ok(ids.includes('work_career'));
 assert.ok(ids.includes('financial_practical'));
 assert.ok(ids.includes('wellbeing_habits'));
 assert.equal(r.routing_basis.multi_need,true);
});

test('safety override disables all commercial actions',()=>{
 const r=routeSituation({category:'Dinero',title:'No puedo pagar',story:'Tengo deudas y estoy pensando en quitarme la vida.'});
 assert.equal(r.safety_override,true);
 assert.equal(r.primary.id,'urgent_safety');
 assert.equal(r.commercial_allowed,false);
 assert.ok(r.next_actions.every(x=>x.commercial===false));
});

test('loneliness does not automatically become clinical or matchmaking',()=>{
 const r=routeSituation({category:'Soledad',title:'Estoy solo',story:'Me mudé y no tengo amigos aquí.'});
 assert.equal(r.primary.id,'social_community');
 assert.equal(r.diagnostic,false);
 assert.ok(!r.needs.some(x=>x.id==='matchmaking'));
});

test('financial need is restricted rather than direct product selling',()=>{
 const r=routeSituation({category:'Dinero',title:'Tengo varias deudas',story:'Tengo préstamo, facturas y deuda con el banco.'});
 const finance=r.needs.find(x=>x.id==='financial_practical');
 assert.equal(finance.action.commercial,'restricted');
});

test('router remains non diagnostic',()=>{
 const r=routeSituation({category:'Autoestima',story:'No duermo y estoy agotado desde hace semanas.',needs:['orientacion_profesional']});
 assert.equal(r.diagnostic,false);
 assert.equal(r.automated_clinical_decision,false);
});
