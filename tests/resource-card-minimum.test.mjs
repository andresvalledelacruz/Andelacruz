import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {cardContexts} from '../scripts/lib/resource-context.mjs';
const read = file => readFileSync(file, 'utf8');
const options = JSON.parse(read('content/resource-card-options.json'));

test('all ten main destinations expose at least fifteen distinct real subcards without JavaScript', () => {
  assert.deepEqual(Object.keys(options), Object.keys(cardContexts));
  for (const [file, cards] of Object.entries(options)) {
    const html = read(file);
    const section = file === 'ayuda-urgente.html' ? html : html.match(/<section class="wrap guide-options">[\s\S]*?<\/section>/)[0];
    const cls = file === 'ayuda-urgente.html' ? 'privacy-bar' : 'cardlink';
    assert.ok((section.match(new RegExp(`<a class="${cls}"`, 'g')) || []).length >= 15, file);
    assert.ok(cards.length >= 15, file);
    assert.equal(new Set(cards.map(card => card.url)).size, cards.length, file);
    for (const card of cards) {
      assert.ok(card.title && card.description, file);
      assert.ok(section.includes(`href="${card.url.replaceAll('&','&amp;')}"`), `${file}: ${card.url}`);
      if (card.url.startsWith('tel:')) continue;
      const url = new URL(card.url, 'https://desgracias.es');
      assert.equal(url.origin, 'https://desgracias.es');
      const target = url.pathname === '/' ? 'index.html' : url.pathname.slice(1) + (url.pathname.endsWith('/') ? 'index.html' : '');
      assert.ok(existsSync(target), `${file}: missing ${target}`);
      if (url.hash) assert.ok(read(target).includes(`id="${url.hash.slice(1)}"`), `${file}: missing ${card.url}`);
    }
    assert.ok(html.includes('href="tel:112"'), file);
  }
});

test('each expandable directory topic exposes the same minimum with no duplicate destinations', () => {
  const html = read('recursos/index.html');
  const branches = [...html.matchAll(/<details class="resource-branch">[\s\S]*?<\/details>/g)];
  assert.equal(branches.length, 10);
  for (const [branch] of branches) {
    const links = [...branch.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
    assert.ok(links.length >= 15);
    assert.equal(new Set(links).size, links.length);
    assert.ok(branch.includes(`Ver ${links.length} opciones`));
  }
});

test('static story bubbles start with crisis and suicide and alphabetize every other label', () => {
  const html = read('index.html').match(/<div class="story-filters"[\s\S]*?<\/div>/)[0];
  const labels = [...html.matchAll(/<button[^>]*>([^<]+)<\/button>/g)].map(match => match[1]);
  assert.equal(labels[0], 'Crisis y suicidio');
  assert.equal(labels.length, 11);
  assert.deepEqual(labels.slice(1), [...labels.slice(1)].sort((a,b) => a.localeCompare(b,'es',{sensitivity:'base'})));
});
