import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const directory=JSON.parse(readFileSync(new URL('data/help-directory.json',root),'utf8'));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const organizations=directory.records.filter(record=>record.kind==='organization');
const byCountry=new Map();
for(const record of organizations){
 if(!byCountry.has(record.country))byCountry.set(record.country,[]);
 byCountry.get(record.country).push(record);
}
const groups=[...byCountry].sort((a,b)=>a[0]==='ES'?-1:b[0]==='ES'?1:directory.countries[a[0]].localeCompare(directory.countries[b[0]],'es')).map(([code,records])=>
 `<section><h3>${escape(directory.countries[code])}</h3><ul>${records.sort((a,b)=>a.name.localeCompare(b.name,'es')).map(record=>`<li><a href="${escape(record.url)}" rel="noreferrer" lang="${escape(record.language)}">${escape(record.name)}</a></li>`).join('')}</ul></section>`
).join('');
const file=new URL('webs-amigas.html',root);
const html=readFileSync(file,'utf8');
const updated=html.replace(/<noscript>[\s\S]*?<\/noscript>/,
 `<noscript><section class="empty-country"><h2>Webs amigas sin JavaScript</h2><p>Organizaciones revisadas, por país y por nombre. Para servicios concretos, consulta <a href="/recursos/">Recursos</a>.</p>${groups}</section></noscript>`);
if(updated===html)throw new Error('No se encontró el bloque de acceso sin JavaScript');
writeFileSync(file,updated);
