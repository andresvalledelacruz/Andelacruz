import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { renderDirectory, categories } from '../scripts/build-resource-directory.mjs';

const records = JSON.parse(await readFile(new URL('../recursos/catalog.json', import.meta.url), 'utf8'));
const html = await readFile(new URL('../recursos/index.html', import.meta.url), 'utf8');
test('country choices put Spain first, then use Spanish alphabetical order and a shared flag sprite', async () => {
  const win={};runInNewContext(await readFile(new URL('../country-options.js',import.meta.url),'utf8'),{window:win});
  const names=Array.from(win.DesgraciasCountryOptions,([,name])=>name);
  assert.equal(names[0],'España');
  assert.deepEqual(names.slice(1),[...names.slice(1)].sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'})));
  assert.equal((await readFile(new URL('../assets/country-flags.png',import.meta.url))).length<40000,true);
});
test('catalog has unique real routes and every category has guides', async () => {
  assert.equal(new Set(records.map(r => r.id)).size, records.length);
  assert.equal(new Set(records.map(r => r.url)).size, records.length);
  for (const [id] of categories) assert.ok(records.some(r => r.category === id), id);
  for (const r of records) {
    assert.ok(categories.some(([id]) => id === r.category));
    assert.ok(r.title && r.description);
    assert.match(r.url, /^\/(?!\/)/);
    await access(new URL(`..${r.url}${r.url.endsWith('/') ? 'index.html' : ''}`, import.meta.url));
  }
});
test('static fallback matches catalog and keeps crisis help outside filtered list', async () => {
  assert.equal(html, await renderDirectory());
  for (const r of records) assert.ok(html.includes(`href="${r.url}"`));
  assert.ok(html.indexOf('href="tel:112"') < html.indexOf('id="resource-directory"'));
  assert.ok(html.indexOf('href="tel:024"') < html.indexOf('id="resource-directory"'));
  assert.ok(!/visitor-analytics|public-page-runtime/.test(html));
  assert.equal((html.match(/class="country-button(?: country-unavailable)?"/g)||[]).length,58);
  assert.equal((html.match(/class="country-resource-group"/g)||[]).length,16);
  assert.ok(html.indexOf('data-country="ES"') < html.indexOf('data-country="DE"'));
  assert.ok(html.includes('src="/country-resource-directory.js"'));
  assert.ok(html.includes('background-image:url(/assets/country-flags.png)'));
  await access(new URL('../assets/country-flags.png',import.meta.url));
});
test('filters and reset work locally without hiding emergency assistance', async () => {
  const events = {};
  const select = { value: 'duelo', addEventListener: (name, fn) => { events[name] = fn; }, focus() { this.focused = true; } };
  const reset = { addEventListener: (name, fn) => { events.reset = fn; } };
  const cards = records.map(r => ({ dataset: { category: r.category }, hidden: false }));
  const count = { textContent: '' };
  const filters = { hidden: true };
  const nodes = { 'resource-category': select, 'resource-directory': { children: cards }, 'resource-count': count, 'resource-filters': filters, 'resource-reset': reset };
  runInNewContext(await readFile(new URL('../resource-directory.js', import.meta.url), 'utf8'), { document: { getElementById: id => nodes[id] } });
  assert.equal(filters.hidden, false);
  events.change();
  assert.equal(cards.filter(c => !c.hidden).length, records.filter(r => r.category === 'duelo').length);
  assert.ok(cards.every(c => c.hidden === (c.dataset.category !== 'duelo')));
  events.reset();
  assert.ok(cards.every(c => !c.hidden));
  assert.equal(select.focused, true);
  assert.equal(count.textContent, `${records.length} de ${records.length} guías disponibles`);
});
test('country selector shows only the selected resources and handles missing coverage', async () => {
  const directory=JSON.parse(await readFile(new URL('../data/help-directory.json',import.meta.url),'utf8'));
  const codes=['ES','MX','DE','JP'];
  const buttons=codes.map(code=>({dataset:{country:code},pressed:'false',setAttribute(key,value){this.pressed=value;},querySelector(){return {textContent:{ES:'España',MX:'México',DE:'Alemania',JP:'Japón'}[code]};}}));
  const groups=codes.filter(code=>code!=='JP').map(code=>({dataset:{country:code},hidden:false,querySelectorAll(){return Array(directory.records.filter(r=>r.country===code&&r.kind==='resource').length).fill({});}}));
  const box={querySelectorAll:()=>buttons,addEventListener(name,handler){this.click=handler;}};
  const host={querySelectorAll:()=>groups};const status={textContent:''};const empty={hidden:true};const history={replaceState(_,__,hash){this.hash=hash;}};
  const nodes={'resource-country-buttons':box,'resource-country-groups':host,'resource-country-status':status,'country-resource-empty':empty};
  runInNewContext(await readFile(new URL('../country-resource-directory.js',import.meta.url),'utf8'),{document:{getElementById:id=>nodes[id],querySelectorAll:()=>Array(records.length).fill({})},location:{hash:'#pais-DE'},history});
  assert.equal(groups.find(g=>g.dataset.country==='DE').hidden,false);
  assert.equal(groups.find(g=>g.dataset.country==='MX').hidden,true);
  assert.match(status.textContent,/Alemania: 4 enlaces/);
  const chosen=buttons.find(b=>b.dataset.country==='MX');box.click({target:{closest:()=>chosen}});
  assert.equal(groups.find(g=>g.dataset.country==='MX').hidden,false);
  assert.match(status.textContent,/México: 8 enlaces/);
  assert.equal(history.hash,'#pais-MX');
  box.click({target:{closest:()=>buttons.find(b=>b.dataset.country==='JP')}});
  assert.equal(empty.hidden,false);
  assert.match(status.textContent,/sin enlaces revisados/);
});
