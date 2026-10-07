import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {auditSeoDiscovery} from '../scripts/lib/seo-discovery.mjs';

test('sitemap pages remain reachable through static links; important journeys stay within two clicks',()=>{
  const report=auditSeoDiscovery();assert.deepEqual(report.errors,[]);
  for(const route of ['/profesionales.html','/soledad/no-tengo-con-quien-hablar/','/trabajo/mi-curriculum-no-funciona/','/trabajo/necesito-formacion-para-encontrar-trabajo/','/ansiedad/','/salud/','/violencia/']){
    const page=report.pages.find(p=>p.url==='https://desgracias.es'+route);
    assert.ok(page && page.depth<=2,route);
  }
});
test('comments, scripts and nofollow links cannot conceal an orphan page',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'seo-discovery-'));
  try {
    fs.mkdirSync(path.join(root,'guide'));
    fs.writeFileSync(path.join(root,'sitemap.xml'),'<loc>https://desgracias.es/</loc><loc>https://desgracias.es/guide/</loc>');
    fs.writeFileSync(path.join(root,'guide/index.html'),'<a href="/">Inicio</a>');
    fs.writeFileSync(path.join(root,'index.html'),'<!-- <a href="/guide/">Guide</a> --><script>const text=\'<a href="/guide/">Guide</a>\';</script><a rel="nofollow" href="/guide/">Guide</a>');
    assert.equal(auditSeoDiscovery(root).ok,false);
    fs.appendFileSync(path.join(root,'index.html'),'<a href="/guide/">Guide</a>');
    assert.equal(auditSeoDiscovery(root).ok,true);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('professional sitemap date agrees with the actual published funnel update',()=>{
  const xml=fs.readFileSync('sitemap.xml','utf8');
  const date=xml.match(/<loc>https:\/\/desgracias.es\/profesionales.html<\/loc><lastmod>([^<]+)<\/lastmod>/)[1];
  const html=fs.readFileSync('profesionales.html','utf8');
  const page=[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(m=>JSON.parse(m[1])).find(s=>s['@type']==='WebPage');
  assert.equal(date,page.dateModified);assert.equal(date,'2026-10-07');
});
