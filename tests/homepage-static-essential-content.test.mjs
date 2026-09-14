import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const sourceWithoutScripts = page.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const section = (name) => sourceWithoutScripts.match(new RegExp(`<section\\b[^>]*id="${name}"[^>]*>([\\s\\S]*?)</section>`))?.[1] ?? '';

test('urgent help, search and privacy are native links even when every script fails', () => {
  const header = sourceWithoutScripts.match(/<header\b[^>]*>([\s\S]*?)<\/header>/)?.[1] ?? '';
  assert.match(header, /class="urgent-help-link"[^>]*href="\/ayuda-urgente\.html"/);
  assert.match(header, /href="\/buscar\/"/);
  for (const name of ['inicio', 'necesitas']) {
    assert.match(section(name), /href="\/ayuda-urgente\.html"/);
    assert.match(section(name), /href="\/buscar\/"/);
  }
  assert.ok((sourceWithoutScripts.match(/href="privacidad\.html"/g) ?? []).length >= 2);
  assert.match(sourceWithoutScripts, /<noscript>[\s\S]*?\.main-nav\{display:flex!important/);
  assert.match(sourceWithoutScripts, /data-urgent-help-emphasis/);
  assert.match(sourceWithoutScripts, /\.urgent-help-link:focus-visible/);
});

test('all ten static resources remain available in the approved Safety-first order', () => {
  const resources = section('recursos');
  const expected = ['/ayuda-urgente.html', '/violencia/', '/duelo/', '/ansiedad/', '/gestion-emocional/', '/soledad/', '/salud/', '/trabajo-dinero/', '/rupturas/', '/familia/'];
  const actual = [...resources.matchAll(/<a\b[^>]*href="(\/[^" ]+)"[^>]*>\s*<article/g)].map(x => x[1]);
  assert.deepEqual(actual, expected);
  for (const route of actual) assert.ok(existsSync(new URL(`..${route}${route.endsWith('/') ? 'index.html' : ''}`, import.meta.url)), route);
  assert.match(resources, /data-safety="P0"/);
});

test('static copy discloses editorial examples and paused real-story publication before writing', () => {
  assert.doesNotMatch(page, /Leer historias reales|Nunca compartimos tu información|siempre protegida|seguro y confidencial/);
  assert.match(page, /<title>Desgracias.es \| Historias y recursos/);
  assert.match(section('historias'), /historias de ejemplo ficticias y orientativas/);
  assert.match(page, /id="story-availability"[\s\S]*?publicación de historias reales está en pausa/);
  assert.ok(page.indexOf('id="story-availability"') < page.indexOf('<textarea'));
  const library = readFileSync(new URL('../story-example-library.js', import.meta.url), 'utf8');
  assert.doesNotMatch(library, /document\.title\s*=|meta\[name="description"\]/);
});

test('legacy discovery does not turn the reading card into a second urgent card', () => {
  const runtime = readFileSync(new URL('../search-home-entry.js', import.meta.url), 'utf8');
  let writes = 0;
  const existing = {};
  const grid = { querySelector(selector) { if (selector === '[data-urgent-entry="needs"]') return existing; throw new Error('existing static grid must not be rewritten'); } };
  const document = {
    querySelector(selector) { return selector === '.needs-grid' ? grid : null; },
    querySelectorAll() { return []; },
    createElement() { writes++; throw new Error('unexpected duplicate'); }
  };
  vm.runInNewContext(runtime, { document });
  assert.equal(writes, 0);
});
