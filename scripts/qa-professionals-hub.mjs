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
  for(const javaScriptEnabled of [false,true]) for(const width of [320,390,768,1024,1440]) {
    const context=await browser.newContext({javaScriptEnabled,viewport:{width,height:900}});
    const page=await context.newPage();
    // External fonts are not part of navigation QA; avoid network-dependent delays.
    await page.route('https://fonts.googleapis.com/**', route=>route.abort());
    await page.route('https://fonts.gstatic.com/**', route=>route.abort());
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin+'/', {waitUntil:'networkidle'});
    const homeOptions = page.locator('nav[aria-label="Opciones de Profesionales"] a');
    assert.equal(await homeOptions.count(),5);
    for(let i=0;i<5;i++) assert.ok(await homeOptions.nth(i).isVisible());
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'homepage width');
    if(process.env.QA_SCREENSHOTS) {
      await mkdir(process.env.QA_SCREENSHOTS,{recursive:true});
      await page.locator('#profesionales').screenshot({path:path.join(process.env.QA_SCREENSHOTS,`portada-profesionales-${width}-${javaScriptEnabled}.png`)});
    }
    for(let i=0;i<5;i++) {
      await page.goto(origin+'/');
      await page.locator('nav[aria-label="Opciones de Profesionales"] a').nth(i).focus();
      await page.locator('nav[aria-label="Opciones de Profesionales"] a').nth(i).press('Enter');
      const target=new URL(page.url());
      assert.equal(target.pathname,'/profesionales.html');
      assert.ok(await page.locator(target.hash).isVisible());
    }
    for(const file of ['contacto.html','profesionales.html','alianzas.html']) {
      const response=await page.goto(origin+'/'+file,{waitUntil:'networkidle'});
      assert.equal(response.status(),200);
      const expected=await readFile(path.join(root,file),'utf8');
      assert.equal((await response.text()).replaceAll('\r\n','\n'),expected.replaceAll('\r\n','\n'),file+' matches reviewed source');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),file);
      assert.equal(await page.locator('h1').count(),1);
    }
    for (const [file,selector] of [['/','nav.professionals-home-grid'],['/profesionales.html','nav[aria-label="Participar en Profesionales"]']]) {
      await page.goto(origin+file);
      const panel=page.locator(selector);
      assert.equal(await panel.locator(':scope > *').count(),6);
      assert.deepEqual(await panel.locator('strong').allTextContents(),['Soy profesional','Empresa o entidad','Alianza institucional','Sugerir recurso','Condiciones y transparencia','Buscar profesional']);
      const boxes=await panel.locator(':scope > *').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,h:r.height,w:r.width};}));
      const columns=width>=1024?3:width>=600?2:1;
      for(let i=0;i<6;i++) {
        assert.ok(boxes[i].w>=200,'readable card width');
        if(i%columns) assert.ok(Math.abs(boxes[i].y-boxes[i-1].y)<1,'same row');
        if(i>=columns) assert.ok(boxes[i].y>boxes[i-columns].y,'row order');
        if(columns>1) assert.ok(Math.abs(boxes[i].h-boxes[0].h)<1,'equal heights');
      }
      const ratios=await panel.locator('strong,span').evaluateAll(nodes=>{
        const luminance=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
        return nodes.map(n=>{const ink=luminance(getComputedStyle(n).color);const paper=luminance(getComputedStyle(n.parentElement).backgroundColor);return (Math.max(ink,paper)+.05)/(Math.min(ink,paper)+.05);});
      });
      assert.ok(ratios.every(r=>r>=4.5),'WCAG AA text contrast');
      const inactive=panel.locator('.professional-unavailable');
      assert.equal(await inactive.locator('a,button,[tabindex]').count(),0);
      assert.match(await inactive.textContent(),/Directorio todavía no disponible/);
      const links=panel.locator('a');
      for(let i=0;i<5;i++) {
        await links.nth(i).focus();
        assert.ok(await links.nth(i).evaluate(n=>n===document.activeElement),'keyboard focus');
        assert.equal(await links.nth(i).evaluate(n=>getComputedStyle(n).outlineStyle),'solid');
        await links.nth(i).press('Enter');
        assert.ok(await page.locator(new URL(page.url()).hash).isVisible(),'keyboard destination');
        await page.goto(origin+file);
      }
      if(process.env.QA_SCREENSHOTS) {
        await mkdir(process.env.QA_SCREENSHOTS,{recursive:true});
        await page.locator(file==='/'?'#profesionales':selector).screenshot({path:path.join(process.env.QA_SCREENSHOTS,`grid-${file==='/'?'home':'hub'}-${width}-${javaScriptEnabled}.png`),style:'header{visibility:hidden!important}'});
      }
    }
    await page.goto(origin+'/profesionales.html');
    const routes=page.locator('nav[aria-label="Participar en Profesionales"] a');
    assert.equal(await routes.count(),5);
    for(let i=0;i<5;i++) {
      await routes.nth(i).click();
      const hash=new URL(page.url()).hash;
      assert.ok(await page.locator(hash).isVisible());
    }
    await page.locator('#alianzas a[href="/alianzas.html"]').click();
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
