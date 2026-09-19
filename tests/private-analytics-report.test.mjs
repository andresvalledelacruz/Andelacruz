import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSnapshot,summarize,renderReport} from '../scripts/lib/private-analytics-report.mjs';
import {privateReportDestination} from '../scripts/lib/private-report-path.mjs';
import {mkdtempSync,mkdirSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const row=(day,path,pageviews)=>({day,path,pageviews,referrer_host:'direct',device_class:'desktop'});
const fixture={generated_at:'2026-09-19T12:00:00Z',timezone:'UTC',rows:[row('2026-09-19','/',2),row('2026-09-19','/index.html',3),row('2026-09-13','/familia/',4),row('2026-09-12','/',20)]};
test('UTC windows include today and six previous days; homepage aliases merge',()=>{const s=normalizeSnapshot(fixture);assert.equal(summarize(s,1).total,5);assert.equal(summarize(s,7).total,9);assert.equal(summarize(s,0).total,29);assert.deepEqual(summarize(s,7).pages,[['/',5],['/familia/',4]]);});
test('empty export has zero records without claiming zero people',()=>{const s=normalizeSnapshot({...fixture,rows:[]});assert.equal(summarize(s).total,0);assert.match(renderReport(s),/no personas únicas/);});
test('rejects query data, HTML, invalid calendar dates and future counters',()=>{for(const patch of [{path:'/?email=private'},{path:'/<script>'},{referrer_host:'<img>'},{pageviews:-1},{pageviews:1.5},{day:'2026-02-30'},{day:'2026-09-20'}])assert.throws(()=>normalizeSnapshot({...fixture,rows:[{...fixture.rows[0],...patch}]}));});
test('projects known dimensions only and keeps the report offline',()=>{const html=renderReport({...fixture,secret:'never-export-this',rows:[{...fixture.rows[0],country_code:'ES',user_id:'never-export-this'}]});assert.ok(!html.includes('never-export-this'));assert.ok(!html.includes('country_code'));assert.match(html,/connect-src 'none'/);assert.ok(!/fetch\(|localStorage|sessionStorage|https?:\/\//.test(html));assert.match(html,/No disponible/);});
test('private output rejects repository paths and file symlinks',t=>{
  const temp=mkdtempSync(join(tmpdir(),'private-report-'));
  t.after(()=>rmSync(temp,{recursive:true,force:true}));
  const root=join(temp,'public');mkdirSync(root);
  const inside=join(root,'report.html');writeFileSync(inside,'public');
  assert.throws(()=>privateReportDestination(root,inside),/fuera/);
  assert.throws(()=>privateReportDestination(root,join(root,'new.html')),/fuera/);
  assert.equal(privateReportDestination(root,join(temp,'private.html')),join(temp,'private.html'));
  const link=join(temp,'link.html');
  try {symlinkSync(inside,link);}catch(error){if(error.code==='EPERM'){t.diagnostic('File symlink test needs platform permission; Linux CI executes it.');return;}throw error;}
  assert.throws(()=>privateReportDestination(root,link),/enlace/);
});
