import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {cardContexts, rankResources} from './lib/resource-context.mjs';

const root = new URL('../', import.meta.url);
export function rankMarkup(markup, categories, catalog, className) {
  const pattern = new RegExp(`<a class="${className}"[^>]*>[\\s\\S]*?<\\/a>`, 'g');
  const resources = [...markup.matchAll(pattern)].map(([html]) => ({html, url: html.match(/href="([^"]+)"/)[1]}));
  const ranked = rankResources(resources, categories, catalog);
  let index = 0;
  return markup.replace(pattern, () => ranked[index++].html);
}

export async function buildContextualResources() {
  const catalog = JSON.parse(await readFile(new URL('recursos/catalog.json', root), 'utf8'));
  for (const [path, categories] of Object.entries(cardContexts)) {
    const file = new URL(path, root);
    const html = await readFile(file, 'utf8');
    const updated = path === 'ayuda-urgente.html'
      ? rankMarkup(html, categories, catalog, 'privacy-bar')
      : html.replace(/<section class="wrap guide-options">[\s\S]*?<\/section>/, section => rankMarkup(section, categories, catalog, 'cardlink'));
    if (updated !== html) await writeFile(file, updated);
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildContextualResources();
