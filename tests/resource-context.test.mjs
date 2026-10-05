import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {cardContexts, rankResources} from '../scripts/lib/resource-context.mjs';
import {rankMarkup} from '../scripts/build-contextual-resources.mjs';
const catalog = JSON.parse(readFileSync('recursos/catalog.json', 'utf8'));

test('every card ranks its category before secondary resources while retaining emergencies and all records', () => {
  for (const categories of Object.values(cardContexts)) {
    const own = catalog.find(r => categories.includes(r.category));
    const other = catalog.find(r => !categories.includes(r.category));
    const emergency = {url:'tel:112'};
    const input = [other, own, emergency];
    assert.deepEqual(rankResources(input, categories, catalog), [emergency, own, other]);
    assert.deepEqual(input, [other, own, emergency]);
  }
  const unknown = [{url:'/unknown-a/'}, {url:'/unknown-b/'}];
  assert.deepEqual(rankResources(unknown, ['unknown'], catalog), unknown);
});

test('published suicide page offers personal crisis and suicide support before violence, preserving every original phone', () => {
  const html = readFileSync('ayuda-urgente.html', 'utf8');
  const links = [...html.matchAll(/<a class="privacy-bar" href="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(links.slice(0,3), ['tel:024','/me-preocupa-que-alguien-pueda-suicidarse/','/alguien-cercano-ha-intentado-suicidarse/']);
  for (const phone of ['112','024','061','091','062','016','900018018']) {
    assert.ok(html.indexOf(`href="tel:${phone}"`) < html.indexOf('<a class="privacy-bar"'));
  }
  assert.ok(html.includes('https://wa.me/3460000016'));
  assert.ok(links.length >= 15);
});

test('actual card pages retain options and phones from the base and have deterministic static ranking', () => {
  for (const [path, categories] of Object.entries(cardContexts)) {
    const html = readFileSync(path, 'utf8');
    const base = execFileSync('git', ['show', `f0cd9b3562a2a791b4f84032f9c7f269467a4de2:${path}`], {encoding:'utf8'});
    const section = path === 'ayuda-urgente.html' ? html : html.match(/<section class="wrap guide-options">[\s\S]*?<\/section>/)?.[0];
    assert.ok(section, path);
    assert.equal(rankMarkup(section, categories, catalog, path === 'ayuda-urgente.html' ? 'privacy-bar' : 'cardlink'), section, path);
    for (const [,href] of base.matchAll(/href="([^"]+)"/g)) assert.ok(html.includes(`href="${href}"`), `${path}: lost ${href}`);
  }
});

test('night loneliness and health-specific help precede unrelated relationship and money options', () => {
  const solitude = readFileSync('soledad/index.html','utf8').split('class="wrap guide-options"')[1];
  assert.ok(solitude.indexOf('href="/soledad/me-siento-solo-por-la-noche/"') < solitude.indexOf('href="/rupturas/"'));
  const health = readFileSync('salud/index.html','utf8').split('class="wrap guide-options"')[1];
  assert.ok(health.indexOf('href="/webs-amigas.html#salud"') < health.indexOf('href="/trabajo-dinero/"'));
});
