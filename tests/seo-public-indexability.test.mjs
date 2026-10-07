import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { isIndexable } from '../scripts/lib/robots-indexability.mjs';

const origin = 'https://desgracias.es';
const sitemap = readFileSync('sitemap.xml', 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const hubs = ['/ansiedad/', '/salud/', '/violencia/'];
const localFile = pathname => `.${pathname}${pathname.endsWith('/') ? 'index.html' : ''}`;
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(match => [match[1].toLowerCase(), match[2]]));

test('each sitemap URL resolves to one indexable local page with a self canonical', () => {
  assert.ok(urls.length > 0);
  assert.equal(new Set(urls).size, urls.length, 'duplicate sitemap URL');
  for (const url of urls) {
    const parsed = new URL(url);
    assert.equal(parsed.origin, origin);
    assert.equal(parsed.search + parsed.hash, '', url);
    const file = localFile(parsed.pathname);
    assert.ok(existsSync(file), `${url}: local page missing`);
    const html = readFileSync(file, 'utf8');
    assert.ok(isIndexable(html), `${url}: noindex in sitemap`);
    const canonicals = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => attributes(match[0])).filter(tag => tag.rel === 'canonical');
    assert.deepEqual(canonicals.map(tag => tag.href), [url], `${url}: canonical mismatch`);
  }
});

for (const pathname of hubs) {
  test(`${pathname} remains discoverable, accessible and safe to index`, () => {
    const html = readFileSync(localFile(pathname), 'utf8');
    assert.equal(urls.filter(url => url === origin + pathname).length, 1);
    for (const entry of ['index.html', 'recursos/index.html']) {
      assert.ok(readFileSync(entry, 'utf8').includes(`href="${pathname}"`), `${entry}: hub not linked`);
    }
    assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, 'one clear page heading');
    assert.match(html, /<html lang="es">/);
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]+">/);
    const schema = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
    const breadcrumb = schema.find(item => item['@type'] === 'BreadcrumbList');
    assert.ok(breadcrumb, 'valid breadcrumb schema');
    assert.equal(breadcrumb.itemListElement.at(-1).item, origin + pathname);
    // These hubs have no translated equivalents: do not manufacture hreflang.
    assert.doesNotMatch(html, /<link[^>]+hreflang=/);
    assert.doesNotMatch(html, /adsbygoogle|googlesyndication|data-affiliate|data-professional-match/);
    for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
      const link = new URL(match[1], origin + pathname);
      if (link.origin !== origin) continue;
      const file = localFile(link.pathname);
      assert.ok(existsSync(file), `${match[1]}: broken internal link`);
      if (link.hash) {
        const destination = readFileSync(file, 'utf8');
        assert.ok([...destination.matchAll(/\bid=["']([^"']+)["']/g)].some(id => id[1] === decodeURIComponent(link.hash.slice(1))), `${match[1]}: missing anchor`);
      }
    }
  });
}

test('localized equivalent help pages keep reciprocal hreflang and self canonicals', () => {
  const languages = ['es', 'en', 'fr', 'pt', 'de'];
  for (const language of languages) {
    const html = readFileSync(`ayuda/${language}/index.html`, 'utf8');
    const alternates = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => attributes(match[0])).filter(tag => tag.rel === 'alternate');
    for (const alternate of [...languages, 'x-default']) {
      assert.equal(alternates.filter(tag => tag.hreflang === alternate && tag.href === `${origin}/ayuda/${alternate === 'x-default' ? 'es' : alternate}/`).length, 1, `${language}: missing or duplicate ${alternate}`);
    }
  }
});
