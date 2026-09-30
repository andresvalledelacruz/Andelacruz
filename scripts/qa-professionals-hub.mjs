import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=process.cwd();
const server=createServer(async(req,res)=>{
  try {
    const pathname=new URL(req.url,'http://localhost').pathname;
    const file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
    if(!file.startsWith(root+path.sep)) return res.writeHead(403).end();
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css'})[path.extname(file)]||'application/octet-stream');
    res.end(await readFile(file));
  } catch {res.writeHead(404).end();}
});
const remote=process.env.QA_ORIGIN;
if(!remote) await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=remote||`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch();
try {
  for(const javaScriptEnabled of [false,true]) for(const width of [390,1440]) {
    const context=await browser.newContext({javaScriptEnabled,viewport:{width,height:900}});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    for(const file of ['contacto.html','profesionales.html','alianzas.html']) {
      const response=await page.goto(origin+'/'+file,{waitUntil:'networkidle'});
      assert.equal(response.status(),200);
      const expected=await readFile(path.join(root,file),'utf8');
      assert.equal((await response.text()).replaceAll('\r\n','\n'),expected.replaceAll('\r\n','\n'),file+' matches reviewed source');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),file);
      assert.equal(await page.locator('h1').count(),1);
    }
    await page.goto(origin+'/profesionales.html');
    const routes=page.locator('nav[aria-label="Participar en Profesionales"] a');
    assert.equal(await routes.count(),4);
    for(let i=0;i<4;i++) {
      await routes.nth(i).click();
      const hash=new URL(page.url()).hash;
      assert.ok(await page.locator(hash).isVisible());
    }
    await page.locator('#colaboraciones a[href="/alianzas.html"]').click();
    await page.locator('a.back').click();
    assert.ok(page.url().endsWith('/profesionales.html#colaboraciones'));
    await page.goto(origin+'/contacto.html');
    assert.equal(await page.locator('#recursos,#profesionales,#participar,#colaboraciones').count(),0);
    if(javaScriptEnabled) {
      for(const [old,next] of [['recursos','recursos'],['profesionales','solicitud'],['colaboraciones','colaboraciones'],['participar','participar']]) {
        await page.goto(origin+'/contacto.html#'+old);
        await page.waitForURL('**/profesionales.html#'+next);
      }
    }
    assert.deepEqual(errors,[]);
    if(process.env.QA_SCREENSHOTS) {
      await mkdir(process.env.QA_SCREENSHOTS,{recursive:true});
      await page.goto(origin+'/profesionales.html');
      await page.screenshot({path:path.join(process.env.QA_SCREENSHOTS,`profesionales-${width}-${javaScriptEnabled}.png`),fullPage:true});
    }
    console.log(JSON.stringify({origin,width,javaScriptEnabled,status:'PASS'}));
    await context.close();
  }
} finally {await browser.close();if(!remote) await new Promise(r=>server.close(r));}
