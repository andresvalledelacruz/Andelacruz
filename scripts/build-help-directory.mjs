import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const directory=JSON.parse(readFileSync(new URL('data/help-directory.json',root),'utf8'));
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const organizations=directory.records.filter(record=>record.kind==='organization'&&record.country==='ES');
if(organizations.length!==50)throw new Error('Expected 50 reviewed Spanish organizations');
const groups=new Map();
for(const record of organizations){
 if(!groups.has(record.category))groups.set(record.category,[]);
 groups.get(record.category).push(record);
}
const categories=[...groups.keys()].sort((a,b)=>directory.categories[a].localeCompare(directory.categories[b],'es',{sensitivity:'base'}));
const nav=categories.map(category=>`<a href="#${category}">${escape(directory.categories[category])}</a>`).join('');
const sections=categories.map(category=>`<section class="friends-group" id="${category}"><h2>${escape(directory.categories[category])}</h2><div class="friends-grid">${groups.get(category).sort((a,b)=>a.name.localeCompare(b.name,'es',{sensitivity:'base'})).map(record=>`<a class="friends-card" href="${escape(record.url)}" rel="noreferrer" lang="${escape(record.language)}" data-organization="${escape(record.id)}" data-country="ES"><h3>${escape(record.name)}</h3><p>${escape(record.description)}</p><span class="friends-link">${escape(new URL(record.url).hostname.replace(/^www\./,''))} →</span></a>`).join('')}</div></section>`).join('\n');
const block=`<!-- friends-list:start -->\n<nav class="friends-nav" aria-label="Ir a una necesidad">${nav}</nav>\n${sections}\n<!-- friends-list:end -->`;
const file=new URL('webs-amigas.html',root);
let html=readFileSync(file,'utf8');
const pattern=/<!-- friends-list:start -->[\s\S]*?<!-- friends-list:end -->/;
if(pattern.test(html))html=html.replace(pattern,block);
else{
 const start=html.indexOf('<section class="country-picker"');
 const end=html.indexOf('<section class="friends-method">');
 if(start<0||end<0||end<=start)throw new Error('Webs Amigas insertion point not found');
 html=html.slice(0,start)+block+'\n'+html.slice(end);
}
writeFileSync(file,html);
