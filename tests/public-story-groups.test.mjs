import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const runtime = readFileSync(new URL('../story-example-library.js', import.meta.url), 'utf8');
const library = JSON.parse(readFileSync(new URL('../content/historias-ejemplo-v1.json', import.meta.url), 'utf8'));

test('public groups expose critical situations, limit scrolling and allow every example to be read', () => {
  class Element {
    children = []; dataset = {}; attributes = {}; handlers = {}; hidden = false;
    classList = { toggle() {} };
    setAttribute(key, value) { this.attributes[key] = value; }
    addEventListener(event, handler) { this.handlers[event] = handler; }
    append(child) { this.children.push(child); }
    replaceChildren() { this.children = []; }
    querySelectorAll() { return this.children; }
    querySelector() { return { focus() {} }; }
    before(element) { this.status = element; }
    after(element) { this.more = element; }
  }
  const filters = new Element();
  const grid = new Element();
  const keys = ['crisis', 'violencia', 'ansiedad', 'cuidados', 'duelo', 'soledad', 'pareja', 'familia', 'trabajo', 'dinero'];
  for (let i = 0; i < library.stories.length; i++) {
    const card = new Element(); card.dataset.category = keys[i % keys.length]; grid.append(card);
  }
  const document = { querySelector: () => filters, createElement: () => new Element() };
  const source = runtime.slice(runtime.indexOf('  function installGroups('), runtime.indexOf('  function isConfirmedEmpty('));
  const context = vm.createContext({ document, STORY_SECTION: '#historias' });
  vm.runInContext(source, context);
  context.installGroups(grid, library);
  assert.deepEqual(filters.children.slice(0, 4).map(button => button.dataset.group), keys.slice(0, 4));
  assert.equal(grid.children.filter(card => !card.hidden).length, 6);
  grid.more.handlers.click();
  assert.equal(grid.children.filter(card => !card.hidden).length, 12);
  grid.more.handlers.click();
  assert.equal(grid.children.filter(card => !card.hidden).length, 18);
  assert.equal(grid.more.hidden, true);
  for (const button of filters.children.slice(0, 10)) {
    button.handlers.click();
    assert.ok(grid.children.filter(card => !card.hidden).every(card => card.dataset.category === button.dataset.group));
    assert.equal(button.attributes['aria-pressed'], 'true');
    assert.ok(grid.children.some(card => !card.hidden));
  }
  filters.children.at(-1).handlers.click();
  assert.equal(grid.children.filter(card => !card.hidden).length, 6);
});
