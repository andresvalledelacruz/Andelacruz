import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { publicProfiles, renderPublicProfile, matchPublicProfessionals } from '../scripts/lib/professional-directory.mjs';
const profile = () => ({id:'sample',name:'<script>alert(1)</script>',profession:'Formación',description:'Orientación',area:'España',modality:'Online',languages:'Español',pricing:'Consultar presupuesto',website:'https://example.org/',categories:['education'],status:'published',publication_authorized:true,review:{identity_verified:true,credentials_verified:true,terms_verified:true,reviewer_reference:'private-review-1',reviewed_at:'2026-10-01',expires_at:'2099-01-01',sources:['https://example.org/register']}});
const registry = p => ({version:1,profiles:[p]});
test('Public directory is empty until real reviewed profiles exist',()=>assert.deepEqual(publicProfiles(JSON.parse(fs.readFileSync('data/professional-directory.json'))),[]));
test('Publication rejects missing evidence, consent, expired reviews and unsafe URLs',()=>{
  assert.equal(publicProfiles(registry(profile())).length,1);
  for(const mutate of [p=>p.status='pending',p=>p.publication_authorized=false,p=>p.review.credentials_verified=false,p=>p.review.sources=[],p=>p.review.expires_at='2026-01-01',p=>p.review.reviewed_at='2099-01-01',p=>p.website='javascript:alert(1)',p=>p.review.sources=['http://example.org/']]){
    const p=profile();mutate(p);assert.deepEqual(publicProfiles(registry(p)),[]);assert.throws(()=>renderPublicProfile(p));
  }
});
test('Public rendering escapes content and excludes private review references',()=>{
  const html=renderPublicProfile(profile());assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('private-review-1'));
});
test('Matching denies sensitive and unknown routes even with a published profile',()=>{
  const input={registry:registry(profile()),category:'education',route:'/violencia/',safety_level:'P0',critical_routes:['/violencia/'],prerequisites:{commercial_phase_authorized:true,insurance_risk_review_complete:true,legal_privacy_review_complete:true,consent_mechanism_ready:true,surface_approved:true}};
  assert.deepEqual(matchPublicProfessionals(input),[]);
  assert.deepEqual(matchPublicProfessionals({...input,route:'/training/',safety_level:'UNKNOWN'}),[]);
  assert.deepEqual(matchPublicProfessionals({...input,route:'/training/',safety_level:'P3',category:'mental_health'}),[]);
  assert.equal(matchPublicProfessionals({...input,route:'/training/',safety_level:'P3'}).length,1);
  assert.deepEqual(matchPublicProfessionals({...input,route:'/training/',safety_level:'P3',prerequisites:{}}),[]);
});
test('Funnel distinguishes preparing mail from real delivery and ignores sensitive routes',()=>{
  const source=fs.readFileSync('professional-funnel.js','utf8');
  for(const path of ['/profesionales.html','/violencia/','/ayuda-urgente.html']){
    const events=[],handlers={};let valid=false;
    vm.runInNewContext(source,{window:{location:{pathname:path},dispatchEvent:e=>events.push(e.detail)},document:{getElementById:()=>({addEventListener:(name,fn)=>handlers[name]=fn,checkValidity:()=>valid})},CustomEvent:function(type,{detail}){this.detail=detail;}});
    if(path!='/profesionales.html'){assert.equal(events.length,0);continue;}
    handlers.input();handlers.submit();valid=true;handlers.submit();
    assert.deepEqual(events.map(e=>e.stage),['view','application_start','email_prepared']);
    assert.ok(events.every(e=>Object.keys(e).sort().join(',')==='stage,surface,version'));
  }
});

const eligibleMatch = profiles => ({registry:{version:1,profiles},category:'education',route:'/training/',safety_level:'P3',critical_routes:['/violencia/'],prerequisites:{commercial_phase_authorized:true,insurance_risk_review_complete:true,legal_privacy_review_complete:true,consent_mechanism_ready:true,surface_approved:true}});

test('Rejected duplicate cannot supply categories to a published profile',()=>{
  const published=profile();published.categories=['employment'];
  const rejected=profile();rejected.publication_authorized=false;
  const input=eligibleMatch([published,rejected]);
  assert.equal(publicProfiles(input.registry).length,1);
  assert.deepEqual(matchPublicProfessionals(input),[]);
  assert.equal(matchPublicProfessionals({...input,category:'employment'}).length,1);
  assert.deepEqual(matchPublicProfessionals(eligibleMatch([rejected,published])),[]);
});

test('Matching rejects malformed category declarations without throwing',()=>{
  for(const categories of ['education',{includes:true},null,['education','mental_health'],['education',null]]){
    const p=profile();p.categories=categories;
    assert.deepEqual(matchPublicProfessionals(eligibleMatch([p])),[]);
  }
  assert.equal(matchPublicProfessionals(eligibleMatch([profile()])).length,1);
});
