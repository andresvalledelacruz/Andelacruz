import {readFileSync,writeFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const root=new URL('../',import.meta.url);
const win={};
runInNewContext(readFileSync(new URL('country-options.js',root),'utf8'),{window:win});
const countries=Array.from(win.DesgraciasCountryOptions,([code,name])=>[code,name]);
const directory=JSON.parse(readFileSync(new URL('data/help-directory.json',root),'utf8'));
const covered=new Set(directory.records.filter(record=>record.kind==='resource').map(record=>record.country));
covered.add('ES');
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const cards=countries.map(([code,name])=>`<a class="country-button${covered.has(code)?'':' country-unavailable'}" data-country="${code}" href="/recursos/#pais-${code}" aria-label="Ver recursos de ${escape(name)}"><span>${escape(name)}</span></a>`).join('');
const block=`<!-- country-cards:start -->\n        <div class="home-country-links" aria-labelledby="home-country-title"><h3 id="home-country-title">Recursos por país</h3><p>Elige un país o la Unión Europea para ver los enlaces disponibles. Las opciones atenuadas aún no tienen enlaces revisados.</p><div class="country-buttons">${cards}</div></div>\n        <!-- country-cards:end -->`;
const path=new URL('index.html',root);
let html=readFileSync(path,'utf8');
const pattern=/<!-- country-cards:start -->[\s\S]*?<!-- country-cards:end -->/;
if(pattern.test(html))html=html.replace(pattern,block);
else{
 const marker='        </div>\n      </div>\n    </section>\n\n    <section class="professionals section"';
 if(!html.includes(marker))throw new Error('Home Resources insertion point not found');
 html=html.replace(marker,`        </div>\n${block}\n      </div>\n    </section>\n\n    <section class="professionals section"`);
}
const css='  <link rel="stylesheet" href="/assets/country-card.css?v=20260927-4">\n';
if(!html.includes(css))html=html.replace('  <link rel="stylesheet" href="styles.css">\n',`  <link rel="stylesheet" href="styles.css">\n${css}`);
writeFileSync(path,html);
