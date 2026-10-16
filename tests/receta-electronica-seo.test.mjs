import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('electronic prescription metadata names the procedure and remains aligned with its official source', () => {
  const html = readFileSync('receta-electronica-otra-comunidad/index.html', 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/)[1];
  assert.match(title, /^Receta electrónica en otra comunidad:/);
  assert.match(html, /<h1>Receta electrónica en otra comunidad:/);
  assert.ok(html.includes(`property="og:title" content="${title}"`));
  const article = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(article.headline, title);
  const description = html.match(/name="description" content="([^"]+)"/)[1];
  assert.match(description, /tarjeta sanitaria física o virtual/);
  assert.ok(html.includes(`property="og:description" content="${description}"`));
  assert.equal(article.description, description);
  assert.ok(html.includes('https://www.sanidad.gob.es/areas/saludDigital/recetaElectronicaSNS/faq/faq.htm'));
  const sitemap = readFileSync('sitemap.xml', 'utf8');
  const lastmod = sitemap.match(/<loc>https:\/\/desgracias.es\/receta-electronica-otra-comunidad\/<\/loc><lastmod>([^<]+)<\/lastmod>/)[1];
  assert.equal(article.dateModified, lastmod);
  assert.equal(lastmod, '2026-10-16');
});
