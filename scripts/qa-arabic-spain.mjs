import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=fileURLToPath(new URL('../',import.meta.url));
const server=createServer(async(req,res)=>{try{
 const name=new URL(req.url,'http://localhost').pathname;
 const file=path.resolve(root,'.'+name+(name.endsWith('/')?'index.html':''));
 if(!file.startsWith(root)){res.writeHead(403).end();return;}
 res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'}[path.extname(file)]||'application/octet-stream'));
 res.end(await readFile(file));
}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch();
await mkdir(path.join(root,'qa-global'),{recursive:true});
try{
 for(const width of [320,390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});
  const requests=[],errors=[];
  await context.route('**/*',r=>{if(!r.request().url().startsWith(origin)){requests.push(r.request().url());return r.abort();}return r.continue();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${origin}/ayuda/ar/`,{waitUntil:'networkidle'});
  assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
  assert.equal(await page.locator('#help-country').inputValue(),'ES');
  for(const [query,topic] of [['ما عنديش باش نخلص الكرا','vivienda'],['بغيت الوراق','refugio']]){
   await page.locator('#help-query').fill(query);await page.locator('button[type=submit]').click();
   assert.equal(await page.locator('#help-query').inputValue(),'');
   assert.equal(await page.locator('li[data-topic]:visible').count(),1);
   assert.equal(await page.locator('li[data-topic]:visible').getAttribute('data-topic'),topic);
   assert.ok(await page.locator('a[href="tel:112"]').isVisible());
  }
  for(const query of ['بغيت نموت وعندي ديون','مابغيتش نعيش','كلام غير واضح']){
   await page.locator('#help-query').fill(query);await page.locator('button[type=submit]').click();
   assert.equal(await page.locator('li[data-topic]:visible').count(),4);
   assert.ok(await page.locator('a[href="tel:024"]').isVisible());
   assert.equal(page.url(),`${origin}/ayuda/ar/`);
  }
  assert.equal(await page.locator('a[href^="tel:"]').count(),2);
  assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  await page.screenshot({path:path.join(root,`qa-global/arabic-${width}.png`),fullPage:true});
  await context.close();console.log(`PASS Arabic Spain ${width}px: RTL, topics, crisis, ambiguity, no network or storage`);
 }
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}});
 const page=await context.newPage();await page.goto(`${origin}/ayuda/ar/`);
 assert.ok(await page.locator('a[href="tel:112"]').isVisible());assert.ok(await page.locator('a[href="tel:024"]').isVisible());
 assert.equal(await page.locator('li[data-topic]:visible').count(),4);
 await context.close();console.log('PASS Arabic no-JS access');
}finally{await browser.close();await new Promise(r=>server.close(r));}
