import fs from 'node:fs';
import path from 'node:path';

const ORIGIN = 'https://desgracias.es';

function sitemapUrls(xml) {
  const urls = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) => match[1].trim());
  if (urls.length === 0) throw new Error('Sitemap is empty or cannot be parsed');
  for (const url of urls) {
    if (new URL(url).origin !== ORIGIN) throw new Error(`Unexpected sitemap origin: ${url}`);
  }
  return urls;
}

function safetyRoutes(markdown) {
  return [...markdown.matchAll(/^\|\s*`(\/[^`]+)`\s*\|/gm)].map((match) => match[1]);
}

export function publicAuditUrls(root) {
  const sitemap = sitemapUrls(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'));
  const routes = safetyRoutes(fs.readFileSync(path.join(root, 'SAFETY_ROUTE_INVENTORY.md'), 'utf8'));
  if (routes.length === 0) throw new Error('Safety inventory is empty or cannot be parsed');
  const safety = routes
    .map((route) => new URL(route, ORIGIN).href);
  const launchCritical = [`${ORIGIN}/buscar/`];
  return [...new Set([...sitemap, ...safety, ...launchCritical])];
}
