import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {cardContexts} from './lib/resource-context.mjs';
const {chromium} = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const server = createServer(async(req,res)=>{
  try {
    const pathname = new URL(req.url,'http://localhost').pathname;
    const file = path.resolve(root, '.'+pathname+(pathname.endsWith('/')?'index.html':''));
    if (!file.startsWith(root)) return res.writeHead(403).end();
    res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css'}[path.extname(file)] || 'application/octet-stream'));
    res.end(await readFile(file));
  } catch {res.writeHead(404).end();}
});
const remote = process.env.QA_ORIGIN;
if (!remote) await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin = remote || `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
try {
  for (const javaScriptEnabled of [false,true]) for (const width of [390,1440]) {
    const context = await browser.newContext({javaScriptEnabled, viewport:{width,height:900}});
    const page = await context.newPage();
    await page.route('https://fonts.googleapis.com/**',route=>route.abort());
    await page.route('https://fonts.gstatic.com/**',route=>route.abort());
    for (const file of Object.keys(cardContexts)) {
      const route = '/'+file.replace(/index.html$/,'');
      const expectedHtml = await readFile(path.join(root,file),'utf8');
      const expectedSection = file === 'ayuda-urgente.html' ? expectedHtml : expectedHtml.match(/<section class="wrap guide-options">[\s\S]*?<\/section>/)[0];
      const cls = file === 'ayuda-urgente.html' ? 'privacy-bar' : 'cardlink';
      const expected = [...expectedSection.matchAll(new RegExp(`<a class="${cls}" href="([^"]+)"`,'g'))].map(m=>m[1]);
      const response = await page.goto(origin+route,{waitUntil:'networkidle'});
      assert.equal(response.status(),200,route);
      const links = page.locator(file === 'ayuda-urgente.html' ? 'a.privacy-bar' : '.guide-options a.cardlink');
      assert.deepEqual(await links.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href'))),expected,route);
      assert.ok(await links.count() >= 15,route);
      assert.ok(await links.first().isVisible(),route);
      assert.ok(await page.locator('a[href="tel:112"]').first().isVisible(),route);
      if (file === 'ayuda-urgente.html') {
        assert.ok(await page.locator('a[href="tel:024"]').first().isVisible());
        assert.deepEqual(expected.slice(0,3),['tel:024','/me-preocupa-que-alguien-pueda-suicidarse/','/alguien-cercano-ha-intentado-suicidarse/']);
      }
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route);
    }
    await page.goto(origin+'/recursos/',{waitUntil:'networkidle'});
    const branches=page.locator('details.resource-branch');
    assert.equal(await branches.count(),10);
    for(let i=0;i<10;i++) {
      await branches.nth(i).locator('summary').click();
      const sublinks=branches.nth(i).locator('ul a');
      assert.ok(await sublinks.count() >= 15);
      assert.ok(await sublinks.first().isVisible());
    }
    await page.goto(origin+'/',{waitUntil:'networkidle'});
    if(javaScriptEnabled) {
      await page.locator('#historias .story-filters [data-group="crisis"]').waitFor();
      const labels=await page.locator('#historias .story-filters button').allTextContents();
      assert.equal(labels[0],'Crisis y suicidio');
      assert.deepEqual(labels.slice(1),[...labels.slice(1)].sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'})));
    }

    await page.locator('#recursos a').filter({hasText:'Suicidio'}).first().focus();
    await page.locator('#recursos a').filter({hasText:'Suicidio'}).first().press('Enter');
    assert.equal(new URL(page.url()).pathname,'/ayuda-urgente.html');
    assert.equal(await page.locator('a.privacy-bar').first().getAttribute('href'),'tel:024');
    console.log(JSON.stringify({origin,width,javaScriptEnabled,cards:10,status:'PASS'}));
    await context.close();
  }
} finally {await browser.close(); if (!remote) await new Promise(r=>server.close(r));}
