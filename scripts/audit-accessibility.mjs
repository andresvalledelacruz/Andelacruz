import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function stripTags(value = '') {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(?:x[0-9a-f]+|\d+);/gi, 'x')
    .replace(/&[a-z]+;/gi, 'x')
    .replace(/\s+/g, ' ')
    .trim();
}

function attrsFrom(tag) {
  const attrs = new Map();
  const attrRe = /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  const opening = tag.replace(/^<\/?\s*[\w:-]+/, '').replace(/\/?>$/, '');
  let match;
  while ((match = attrRe.exec(opening))) {
    attrs.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attrs;
}

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>(https:\/\/desgracias\.es[^<]*)<\/loc>/g)].map((m) => m[1]);
}

function urlToFile(url) {
  const parsed = new URL(url);
  if (parsed.pathname === '/') return path.join(ROOT, 'index.html');
  const relative = parsed.pathname.replace(/^\//, '');
  return path.join(ROOT, relative.endsWith('/') ? relative + 'index.html' : relative);
}

function hasId(html, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\bid=["']${escaped}["']`, 'i').test(html);
}

export function auditHtml(html, source = '<memory>') {
  const errors = [];
  const fail = (message) => errors.push(`${source}: ${message}`);

  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0];
  const htmlAttrs = htmlTag ? attrsFrom(htmlTag) : new Map();
  const lang = htmlAttrs.get('lang') || '';
  if (!/^es(?:-|$)/i.test(lang)) fail('html debe declarar lang="es" o variante española');

  if (!/<meta\b[^>]*name=["']viewport["'][^>]*>/i.test(html)) fail('falta meta viewport');

  const mainCount = (html.match(/<main\b/gi) || []).length;
  if (mainCount !== 1) fail(`debe existir exactamente un <main> (encontrados ${mainCount})`);

  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (h1Count !== 1) fail(`debe existir exactamente un <h1> (encontrados ${h1Count})`);

  const seenIds = new Set();
  for (const match of html.matchAll(/<[^>]+\bid\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    const id = match[1].trim();
    if (!id) continue;
    if (seenIds.has(id)) fail(`id duplicado no permitido: ${id}`);
    seenIds.add(id);
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const attrs = attrsFrom(match[0]);
    if (!attrs.has('alt')) fail(`imagen sin atributo alt: ${match[0].slice(0, 100)}`);
  }

  for (const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const attrs = attrsFrom(`<button${match[1]}>`);
    const text = stripTags(match[2]);
    const label = (attrs.get('aria-label') || '').trim();
    const labelledBy = (attrs.get('aria-labelledby') || '').trim();
    if (!text && !label && !labelledBy) fail('botón sin nombre accesible');
  }

  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = attrsFrom(`<a${match[1]}>`);
    const href = (attrs.get('href') || '').trim();
    const text = stripTags(match[2]);
    const label = (attrs.get('aria-label') || '').trim();
    const labelledBy = (attrs.get('aria-labelledby') || '').trim();
    if (href && !text && !label && !labelledBy) fail(`enlace con href sin nombre accesible: ${href}`);
    if ((attrs.get('target') || '').toLowerCase() === '_blank') {
      const rel = new Set((attrs.get('rel') || '').toLowerCase().split(/\s+/).filter(Boolean));
      if (!rel.has('noopener') || !rel.has('noreferrer')) fail(`target="_blank" sin rel="noopener noreferrer": ${href || '<sin href>'}`);
    }
  }

  for (const match of html.matchAll(/<[^>]+\btabindex\s*=\s*["']?([+-]?\d+)["']?[^>]*>/gi)) {
    if (Number(match[1]) > 0) fail(`tabindex positivo no permitido: ${match[1]}`);
  }

  if (/<(?:input|button|select|textarea)\b[^>]*\bautofocus(?:\s|=|>)/i.test(html)) fail('autofocus no permitido en controles interactivos');

  for (const attribute of ['aria-controls', 'aria-labelledby', 'aria-describedby']) {
    const re = new RegExp(`<[^>]+\\b${attribute}\\s*=\\s*["']([^"']+)["'][^>]*>`, 'gi');
    for (const match of html.matchAll(re)) {
      for (const id of match[1].trim().split(/\s+/)) {
        if (id && !hasId(html, id)) fail(`${attribute} referencia id inexistente: ${id}`);
      }
    }
  }

  return errors;
}

export function auditSitemap(root = ROOT) {
  const xml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const urls = sitemapUrls(xml);
  const errors = [];
  for (const url of urls) {
    const file = urlToFile(url);
    if (!fs.existsSync(file)) {
      errors.push(`${url}: no existe archivo desplegable ${path.relative(root, file)}`);
      continue;
    }
    errors.push(...auditHtml(fs.readFileSync(file, 'utf8'), url));
  }
  return { urls, errors };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { urls, errors } = auditSitemap();
  if (errors.length) {
    console.error(`Accessibility audit failed with ${errors.length} issue(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`Accessibility audit passed for ${urls.length} sitemap URLs.`);
    console.log('Checked: lang, viewport, main/H1 landmarks, unique ids, image alt presence, accessible link/button names, safe _blank links, tabindex, autofocus and ARIA id-reference integrity.');
  }
}
