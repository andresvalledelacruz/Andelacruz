import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright');
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const directory=JSON.parse(await readFile(path.join(root,'data/help-directory.json'),'utf8'));
const countFor=(code)=>directory.records.filter(record=>record.country===code).length;
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1');
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 const body=await readFile(file);
 res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'}[path.extname(file)]||'application/octet-stream'));
 res.end(body);
}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const out=new URL('../qa-global/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch();
try{
 for(const width of [320,390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});
  const outbound=[];await context.route('**/*',r=>{if(!r.request().url().startsWith(origin)){outbound.push(r.request().url());return r.abort();}return r.continue();});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const lang of ['es','en','fr','pt']){
   await page.goto(`${origin}/ayuda/${lang}/`,{waitUntil:'networkidle'});
   assert.ok(await page.locator('#help-form').isVisible());
   await page.locator('#help-country').selectOption('MX');
   await page.locator('#help-query').fill('no tengo chamba');
   await page.locator('#help-form button').click();
   assert.equal(await page.locator('#help-query').inputValue(),'');
   assert.equal(await page.locator('[data-help-country]:not([hidden])').count(),1);
   assert.equal(await page.locator('[data-help-country]:not([hidden])').getAttribute('data-help-country'),'MX');
   assert.equal(await page.locator('[data-help-country="MX"] li:not([hidden])').count(),2);
   await page.locator('#help-country').selectOption('GB');
   await page.locator('#help-query').fill('I want to end my life and cannot pay rent');
   await page.locator('#help-form button').click();
   assert.ok(await page.locator('[data-help-country="GB"] .urgent a').isVisible());
   assert.ok(await page.locator('[data-help-country="GB"] .urgent a').getAttribute('href').then(u=>u.includes('nhs.uk')));
   assert.ok(await page.locator('[data-help-country="GB"] li:not([hidden])').count()>10);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
   if(lang==='en')await page.screenshot({path:new URL(`english-${width}.png`,out).pathname.replace(/^\/([A-Za-z]:)/,'$1'),fullPage:false});
  }
  await page.goto(`${origin}/webs-amigas.html`,{waitUntil:'networkidle'});
  assert.equal(await page.locator('[data-organization]').count(),countFor('ES'));
  assert.equal(await page.locator('[data-organization][data-country="ES"]').count(),countFor('ES'));
  assert.equal(await page.locator('#selected-country-label').textContent(),'🇪🇸 España');
  const anar=page.locator('[data-organization="anar"]');await anar.scrollIntoViewIfNeeded();
  assert.ok((await anar.getAttribute('href')).includes('/telefono-chat-anar/'));
  await page.locator('button[data-country="MX"]').click();
  assert.equal(await page.locator('[data-organization]').count(),countFor('MX'));
  assert.equal(await page.locator('[data-organization][data-country="MX"]').count(),countFor('MX'));
  assert.equal(await page.locator('[data-organization][data-country="ES"]').count(),0);
  assert.equal(await page.locator('#selected-country-label').textContent(),'🇲🇽 México');
  await page.locator('button[data-country="JP"]').click();
  assert.equal(await page.locator('[data-organization]').count(),0);
  assert.match(await page.locator('#country-status').textContent(),/ampliando/i);
  await page.locator('button[data-country="ES"]').click();
  assert.equal(await page.locator('[data-organization]').count(),countFor('ES'));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:new URL(`directory-${width}.png`,out).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
  await page.goto(`${origin}/recursos/`,{waitUntil:'networkidle'});await page.locator('.resource-branch summary').first().click();
  assert.ok(await page.locator('.resource-branch[open] a').count()>1);
  await page.screenshot({path:new URL(`resources-${width}.png`,out).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
  assert.equal(errors.length,0,errors.join('\n'));assert.equal(outbound.length,0,outbound.join('\n'));
  await context.close();console.log(`PASS global help ${width}px`);
 }
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}});const page=await context.newPage();await page.goto(`${origin}/ayuda/en/`);assert.equal(await page.locator('[data-help-country]:visible').count(),9);assert.ok(await page.locator('[data-help-country="GB"] .urgent a').isVisible());await page.goto(`${origin}/recursos/`);await page.locator('.resource-branch summary').first().click();assert.ok(await page.locator('.resource-branch[open] a').first().isVisible());await context.close();console.log('PASS no-JS country links and expandable resources');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
