import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSnapshot,summarize,renderReport} from '../scripts/lib/private-analytics-report.mjs';
import {privateReportDestination} from '../scripts/lib/private-report-path.mjs';
import {mkdtempSync,mkdirSync,writeFileSync,symlinkSync,rmSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const row=(day,path,pageviews,country_code='ES',device_class='desktop')=>({day,path,pageviews,referrer_host:'direct',device_class,country_code});
const fixture={generated_at:'2026-09-19T12:00:00Z',timezone:'UTC',rows:[row('2026-09-19','/',2),row('2026-09-19','/index.html',3),row('2026-09-13','/familia/',4),row('2026-09-12','/',20)]};
test('UTC windows include today and six previous days; homepage aliases merge',()=>{const s=normalizeSnapshot(fixture);const seven=summarize(s,7);assert.equal(summarize(s,1).total,5);assert.equal(seven.total,9);assert.equal(summarize(s,0).total,29);assert.deepEqual(seven.pages,[['/',5],['/familia/',4]]);assert.deepEqual(seven.devices,[['desktop',9]]);assert.deepEqual(seven.countries,[['ES',9]]);});
test('empty export has zero records without claiming zero people',()=>{const s=normalizeSnapshot({...fixture,rows:[]});assert.equal(summarize(s).total,0);assert.match(renderReport(s),/no personas únicas/);});
test('rejects query data, HTML, invalid dimensions, calendar dates and future counters',()=>{for(const patch of [{path:'/?email=private'},{path:'/<script>'},{referrer_host:'<img>'},{country_code:'<ES>'},{country_code:'ESP'},{pageviews:-1},{pageviews:1.5},{day:'2026-02-30'},{day:'2026-09-20'}])assert.throws(()=>normalizeSnapshot({...fixture,rows:[{...fixture.rows[0],...patch}]}));});
test('projects only approved aggregate dimensions and keeps the report offline',()=>{const html=renderReport({...fixture,secret:'never-export-this',rows:[{...fixture.rows[0],country_code:'es',user_id:'never-export-this'}]});assert.ok(!html.includes('never-export-this'));assert.match(html,/País inferido por locale/);assert.match(html,/Clase de dispositivo/);assert.match(html,/connect-src 'none'/);assert.ok(!/fetch\(|localStorage|sessionStorage|https?:\/\//.test(html));assert.match(html,/geolocalización/);});
test('older snapshots without country_code remain readable as unknown',()=>{const older={...fixture,rows:fixture.rows.map(({country_code,...rest})=>rest)};assert.deepEqual(summarize(normalizeSnapshot(older),7).countries,[['unknown',9]]);});
test('private export includes the approved locale-country aggregate',()=>{const sql=readFileSync(new URL('../scripts/export-private-analytics.sql',import.meta.url),'utf8');assert.match(sql,/country_code/);assert.match(sql,/group by day, path, referrer_host, device_class, country_code/);});
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
