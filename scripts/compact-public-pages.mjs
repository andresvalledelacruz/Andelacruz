import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
// Static, progressively enhanced presentation. Preserve all advice and safety text.
const roots=['ansiedad','violencia','duelo','soledad','salud','gestion-emocional','familia','rupturas','trabajo','dinero','trabajo-dinero'];
const nav='<nav class="guide-actions" aria-label="Ayuda"><a href="/buscar/">Buscar ayuda</a><a class="guide-urgent" href="/ayuda-urgente.html">Ayuda urgente</a></nav>';
for(const root of roots){
  const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):e.name==='index.html'?[join(dir,e.name)]:[]);
  for(const file of walk(root)){
    let html=readFileSync(file,'utf8');
    if(!html.includes('/guia.css'))continue;
    if(!html.includes('class="guide-actions"'))html=html.replace(/(<a class="brand"[^>]*>[^<]*<\/a>)/,'$1'+nav);
    const section=html.match(/<section(?:\s[^>]*)?>\s*<h2[^>]*>[^<]*<\/h2>\s*<div class="cards">[\s\S]*?<\/section>/);
    if(section && !html.includes('guide-options')){
      html=html.replace(section[0],'');
      const block=section[0].replace('<section','<section class="wrap guide-options"');
      // Keep concise emergency action before options, move long introduction below.
      const hero=html.match(/<div class="wrap hero">([\s\S]*?)\s*<\/div>\s*(?=<div class="wrap layout">)/);
      if(hero){
        const body=hero[1];
        const lead=body.match(/<p class="lead">[\s\S]*?<\/p>/)?.[0]||'';
        html=html.replace(hero[0],hero[0].replace(lead,'')+block+(lead?'<div class="wrap guide-intro">'+lead+'</div>':''));
      } else html=html.replace('<div class="wrap layout">',block+'<div class="wrap layout">');
    }
    writeFileSync(file,html);
  }
}
