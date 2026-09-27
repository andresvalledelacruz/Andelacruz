#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sitemap = readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(https:\/\/desgracias\.es\/[^<]*)<\/loc>/g)].map((match) => match[1]);
const primary = new Set(['duelo', 'rupturas', 'soledad', 'familia', 'trabajo', 'dinero', 'gestion-emocional', 'salud', 'ansiedad', 'violencia']);
const standaloneGuideArea = new Map([
  ['/receta-electronica-otra-comunidad/', 'salud'],
  ['/incapacidad-temporal-que-tramite/', 'trabajo'],
  ['/reclamar-una-compra/', 'dinero']
]);
const byArea = Object.fromEntries([...primary].map((key) => [key, { guides: 0, hubs: 0 }]));
const other = [];
const anomalies = [];
for (const url of urls) {
  const pathname = new URL(url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  const file = path.join(root, pathname.endsWith('/') ? `${pathname}index.html` : pathname);
  if (!existsSync(file)) { anomalies.push(`Archivo ausente: ${pathname}`); continue; }
  const html = readFileSync(file, 'utf8');
  if (/\<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) { anomalies.push(`Noindex en sitemap: ${pathname}`); continue; }
  if (standaloneGuideArea.has(pathname)) {
    const area = standaloneGuideArea.get(pathname);
    byArea[area].guides++;
    if (!/<article\b/i.test(html)) anomalies.push(`Guía sin article: ${pathname}`);
  } else if (primary.has(segments[0]) && pathname.endsWith('/')) {
    const type = segments.length === 1 ? 'hubs' : 'guides';
    byArea[segments[0]][type]++;
    if (type === 'guides' && !/<article\b/i.test(html)) anomalies.push(`Guía sin article: ${pathname}`);
  } else {
    other.push(pathname);
  }
}
const guides = Object.values(byArea).reduce((sum, area) => sum + area.guides, 0);
const hubs = Object.values(byArea).reduce((sum, area) => sum + area.hubs, 0);
const result = { source: 'sitemap.xml y HTML local', sitemapEntries: urls.length, guides, hubs, otherPages: other.length, goalGuides: 250, remainingGuides: Math.max(0, 250 - guides), byArea, anomalies };
console.log(JSON.stringify(result, null, 2));
if (anomalies.length) process.exitCode = 1;
