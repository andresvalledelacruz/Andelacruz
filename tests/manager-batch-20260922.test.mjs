import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=(path)=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('urgent card full click area is static and does not depend on JS',async()=>{
  const [css,app,index]=await Promise.all([read('styles.css'),read('app.js'),read('index.html')]);
  assert.ok(index.includes('need-card need-primary'));
  assert.ok(css.includes('.need-card.need-primary .need-link::after'));
  assert.ok(css.includes('position:absolute;inset:0'));
  assert.ok(!app.includes('urgent-whole-card-style'));
});

test('interaction analytics are aggregate and homepage-only',async()=>{
  const [js,sql]=await Promise.all([read('visitor-interactions.js'),read('supabase/migrations/20260922090000_add_privacy_safe_interaction_analytics.sql')]);
  for(const forbidden of ['localStorage','sessionStorage','indexedDB','document.cookie','location.search','location.hash']) assert.ok(!js.includes(forbidden));
  assert.ok(js.includes("currentPath !== '/'"));
  assert.ok(sql.includes("v_path <> '/' then return"));
  assert.ok(sql.includes('never free text or persistent user identifiers'));
});

test('ops analytics dashboard is private and explicit about its limits',async()=>{
  const [api,auth,html]=await Promise.all([read('src/ops-api.js'),read('src/ops-authz.js'),read('ops/index.html')]);
  assert.ok(api.includes("/ops/analytics/summary"));
  assert.ok(auth.includes("GET /ops/analytics/summary"));
  assert.ok(html.includes('Qué se visita y con qué se interactúa'));
  assert.ok(html.includes('No usamos seguimiento ocular'));
});

test('growth hubs are indexable and present in growth sitemap',async()=>{
  const files=['temas/index.html','recursos/index.html','suicidio/index.html','fuentes-y-revision.html','prensa.html'];
  for(const file of files){const html=await read(file);assert.ok(html.includes('index,follow'));}
  const suicide=await read('suicidio/index.html');
  assert.ok(suicide.includes('112'));assert.ok(suicide.includes('024'));
  const map=await read('sitemap-growth.xml');
  for(const path of ['/temas/','/recursos/','/suicidio/','/fuentes-y-revision.html','/prensa.html']) assert.ok(map.includes(path));
});
