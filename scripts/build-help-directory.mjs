import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const data=JSON.parse(readFileSync(new URL('data/help-directory.json',root),'utf8'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categories=Object.entries(data.categories).sort((a,b)=>a[1].localeCompare(b[1],'es'));
let html=readFileSync(new URL('webs-amigas.html',root),'utf8');
const nav='<nav class="friends-nav" aria-label="Ir a una necesidad">'+categories.map(([id,name])=>`<a href="#${id}">${esc(name)}</a>`).join('')+'</nav>';
const sections=categories.map(([id,name])=>`<section class="friends-group" id="${id}" aria-labelledby="title-${id}"><h2 id="title-${id}">${esc(name)}</h2><div class="friends-grid">${data.records.filter(r=>r.category===id).sort((a,b)=>a.name.localeCompare(b.name,'es')).map(r=>`<a class="friends-card" data-organization="${r.id}" href="${esc(r.url)}" rel="noreferrer"><h3 lang="${r.language}">${esc(r.name)}</h3><p>${esc(r.description)}</p><small>${esc(data.countries[r.country])} · ${r.language.toUpperCase()} · <time datetime="${r.reviewedAt}">${r.reviewedAt}</time></small><span class="friends-link">${esc(new URL(r.url).hostname.replace(/^www\./,''))} →</span></a>`).join('\n')}</div></section>`).join('\n');
html=html.replace(/<nav class="friends-nav"[\s\S]*?(?=<section class="friends-method")/,nav+sections+'\n')
 .replace(/<title>[^<]*<\/title>/,`<title>Webs amigas: ${data.records.length} recursos por país y necesidad | Desgracias.es</title>`)
 .replace(/(<meta name="description" content=")[^"]+/, `$1Directorio independiente con ${data.records.length} recursos y organizaciones: España, México, Latinoamérica, Reino Unido, Francia, Portugal, Alemania y Unión Europea.`)
 .replace(/(<meta property="og:title" content=")[^"]+/, `$1Webs amigas: ${data.records.length} recursos por país y necesidad`)
 .replace(/<p class="eyebrow">[^<]*<\/p>/,'<p class="eyebrow">Directorio independiente · Recursos por país</p>')
;
html=html.replace(/"name":"Webs amigas: organizaciones de ayuda en España"/,'"name":"Webs amigas: recursos por país"').replace('"dateModified":"2026-09-18"','"dateModified":"2026-09-27"').replace('Directorio editorial independiente de organizaciones de ámbito nacional con fuentes oficiales.','Directorio independiente de recursos y organizaciones por país con fuentes oficiales.');
writeFileSync(new URL('webs-amigas.html',root),html);
