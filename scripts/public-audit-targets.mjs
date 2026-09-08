import fs from 'node:fs';
import path from 'node:path';

const ORIGIN = 'https://desgracias.es';

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>(https:\/\/desgracias\.es[^<]*)<\/loc>/g)].map((match) => match[1]);
}

function safetyRoutes(markdown) {
  return [...markdown.matchAll(/^\|\s*`(\/[^`]+)`\s*\|/gm)].map((match) => match[1]);
}

export function publicAuditUrls(root) {
  const sitemap = sitemapUrls(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'));
  const safety = safetyRoutes(fs.readFileSync(path.join(root, 'SAFETY_ROUTE_INVENTORY.md'), 'utf8'))
    .map((route) => new URL(route, ORIGIN).href);
  const launchCritical = [`${ORIGIN}/buscar/`];
  return [...new Set([...sitemap, ...safety, ...launchCritical])];
}
