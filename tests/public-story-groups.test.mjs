import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const runtime = readFileSync(new URL('../story-example-library.js', import.meta.url), 'utf8');
const library = JSON.parse(readFileSync(new URL('../content/historias-ejemplo-v1.json', import.meta.url), 'utf8'));

test('the full-card button keeps its containing block when hovered',()=>{
  const hover=runtime.match(/\.story-example-read:hover\{([^}]+)\}/)[1];
  assert.doesNotMatch(hover,/filter:|transform:|perspective:/);
  assert.match(runtime,/inset:0;border-radius:inherit;z-index:3/);
});

test('each card has a single native dialog button with a story-specific accessible name', () => {
  class Element {
    children = []; dataset = {}; attributes = {}; handlers = {};
    constructor(tag) { this.tag = tag; }
    append(...children) { this.children.push(...children); }
    setAttribute(key, value) { this.attributes[key] = value; }
    addEventListener(event, handler) { this.handlers[event] = handler; }
  }
  let opened;
  const context = vm.createContext({ document: { createElement: tag => new Element(tag) }, categoryKey: () => 'crisis', visualClass: () => 'story-one', openStory: story => { opened = story; } });
  vm.runInContext(runtime.slice(runtime.indexOf('  function createCard('), runtime.indexOf('  function ensureDialog(')), context);
  const card = context.createCard(library.stories[0], 0, library);
  const all = node => [node, ...node.children.flatMap(all)];
  const controls = all(card).filter(node => ['button', 'a', 'input'].includes(node.tag));
  assert.equal(controls.length, 1);
  assert.equal(controls[0].tag, 'button');
  assert.equal(controls[0].type, 'button');
  assert.equal(controls[0].attributes['aria-haspopup'], 'dialog');
  assert.ok(controls[0].attributes['aria-label'].includes(library.stories[0].title));
  controls[0].handlers.click();
  assert.equal(opened, library.stories[0]);
  assert.match(runtime, /\.story-example-card \.story-example-read::after\{[^}]*position:absolute;inset:0/);
});

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
  while (!grid.more.hidden) grid.more.handlers.click();
  assert.equal(grid.children.filter(card => !card.hidden).length, library.stories.length);
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
