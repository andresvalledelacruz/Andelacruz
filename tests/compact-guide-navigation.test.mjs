import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const hubs=['violencia','ansiedad','duelo','soledad','salud','gestion-emocional','familia','rupturas','trabajo','dinero','trabajo-dinero'];
test('topic guides offer native navigation choices before the long introduction',()=>{
  for(const hub of hubs){
    const html=readFileSync(`${hub}/index.html`,'utf8');
    assert.equal((html.match(/<h1\b/g)||[]).length,1,hub);
    assert.ok(html.includes('class="wrap guide-options"'),hub);
    assert.ok(html.indexOf('guide-options')<html.indexOf('class="lead"'),hub);
    assert.ok(html.includes('class="guide-urgent"'),hub);
    const options=html.match(/<section class="wrap guide-options">([\s\S]*?)<\/section>/)[1];
    const cards=[...options.matchAll(/<a class="cardlink" href="([^"]+)"/g)];
    assert.ok(cards.length>=2,hub);
    for(const [,url] of cards)if(url.startsWith('/')){
      const [pathname,fragment]=url.split('#');
      const file=`.${pathname}${pathname.endsWith('/')?'index.html':''}`;
      assert.ok(existsSync(file),url);
      if(fragment)assert.ok(readFileSync(file,'utf8').includes(`id="${fragment}"`),url);
    }
    assert.doesNotMatch(options,/<button|<input|<select/);
  }
});
test('public guide headings are compact without removing focus or emergency styles',()=>{
 const css=readFileSync('guia.css','utf8');
 assert.ok(css.includes('clamp(1.45rem,3vw,2rem)'));
 assert.ok(css.includes('.cardlink:focus-visible'));
 assert.ok(css.includes('.guide-actions .guide-urgent'));
});
