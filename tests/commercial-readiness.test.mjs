import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {commercialReadiness} from '../scripts/report-commercial-readiness.mjs';
const input=()=>({directory:JSON.parse(fs.readFileSync('data/professional-directory.json','utf8')),partners:JSON.parse(fs.readFileSync('data/monetization-partners.json','utf8')),surfaces:JSON.parse(fs.readFileSync('data/monetization-surfaces.json','utf8'))});
test('unmeasured outcomes never become zero or mail leads',()=>{
 const report=commercialReadiness(input(),new Date('2026-10-07T12:00:00Z'));
 assert.equal(report.decision,'BLOCKED');assert.equal(report.verified_public_profiles,0);
 for(const key of ['received_leads','confirmed_conversions','recognized_revenue_eur'])assert.equal(report[key],null);
 assert.equal(report.commercial_activation_enabled,false);
});
test('ads declaration alone cannot activate advertising or claim account approval',()=>{
 const report=commercialReadiness({...input(),adsText:'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0'});
 assert.equal(report.blockers.find(x=>x.id==='AdSense').ads_txt_google_declaration_present,true);
 assert.equal(report.decision,'BLOCKED');assert.equal(report.commercial_activation_enabled,false);
});
test('invalid or enabled registries fail closed instead of reporting readiness',()=>{
 for(const mutate of [x=>x.directory.profiles=null,x=>x.partners.activation_enabled=true,x=>x.surfaces.activation_enabled=true]){const x=input();mutate(x);assert.throws(()=>commercialReadiness(x));}
});
