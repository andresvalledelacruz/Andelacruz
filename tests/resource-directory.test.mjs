import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { renderDirectory, categories } from '../scripts/build-resource-directory.mjs';

const records = JSON.parse(await readFile(new URL('../recursos/catalog.json', import.meta.url), 'utf8'));
const html = await readFile(new URL('../recursos/index.html', import.meta.url), 'utf8');
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
