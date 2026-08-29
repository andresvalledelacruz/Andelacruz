import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_HTML_BYTES = 128 * 1024;
const MAX_JS_BYTES = 96 * 1024;
const MAX_OPTIMIZED_HERO_BYTES = 100 * 1024;

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>(https:\/\/desgracias\.es[^<]*)<\/loc>/g)].map((match) => match[1]);
}

function urlToFile(url) {
  const parsed = new URL(url);
  if (parsed.pathname === '/') return path.join(ROOT, 'index.html');
  const relative = parsed.pathname.replace(/^\//, '');
  return path.join(ROOT, relative.endsWith('/') ? `${relative}index.html` : relative);
}

function localScriptSources(html) {
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter((src) => src.startsWith('/') && !src.startsWith('//'));
}

function localRefToFile(ref) {
  const parsed = new URL(ref, 'https://desgracias.es');
  return path.join(ROOT, parsed.pathname.replace(/^\//, ''));
}

export function auditPerformance(root = ROOT) {
  const errors = [];
  const xml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const urls = sitemapUrls(xml);
  let largestHtml = { url: '', bytes: 0 };
  const checkedScripts = new Map();

  for (const url of urls) {
    const file = urlToFile(url);
    if (!fs.existsSync(file)) {
      errors.push(`${url}: no existe archivo desplegable`);
      continue;
    }

    const bytes = fs.statSync(file).size;
    if (bytes > largestHtml.bytes) largestHtml = { url, bytes };
    if (bytes > MAX_HTML_BYTES) {
      errors.push(`${url}: HTML ${bytes} bytes supera presupuesto ${MAX_HTML_BYTES}`);
    }

    const html = fs.readFileSync(file, 'utf8');
    for (const src of localScriptSources(html)) {
      const scriptFile = localRefToFile(src);
      if (!fs.existsSync(scriptFile)) {
        errors.push(`${url}: script local inexistente ${src}`);
        continue;
      }
      const scriptBytes = fs.statSync(scriptFile).size;
      checkedScripts.set(src, scriptBytes);
      if (scriptBytes > MAX_JS_BYTES) {
        errors.push(`${src}: JavaScript ${scriptBytes} bytes supera presupuesto ${MAX_JS_BYTES}`);
      }
    }
  }

  const hero = path.join(root, 'assets', 'manos-apoyo.webp');
  if (!fs.existsSync(hero)) {
    errors.push('falta assets/manos-apoyo.webp');
  } else {
    const heroBytes = fs.statSync(hero).size;
    if (heroBytes > MAX_OPTIMIZED_HERO_BYTES) {
      errors.push(`assets/manos-apoyo.webp: ${heroBytes} bytes supera presupuesto ${MAX_OPTIMIZED_HERO_BYTES}`);
    }
  }

  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  if (!/href=["']\/assets\/manos-apoyo\.webp["'][^>]*fetchpriority=["']high["']/i.test(homepage)) {
    errors.push('homepage: el hero WebP debe mantenerse precargado con fetchpriority="high"');
  }
  if (!/srcset=["']assets\/manos-apoyo\.webp["'][^>]*type=["']image\/webp["']/i.test(homepage)) {
    errors.push('homepage: falta fuente WebP del hero en <picture>');
  }
  if (!/<img\b[^>]*\bwidth=["']\d+["'][^>]*\bheight=["']\d+["'][^>]*\bfetchpriority=["']high["']/i.test(homepage)) {
    errors.push('homepage: hero debe conservar dimensiones explícitas y fetchpriority="high" para limitar CLS/LCP');
  }

  return { urls, errors, largestHtml, checkedScripts };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = auditPerformance();
  if (result.errors.length) {
    console.error(`Performance budget audit failed with ${result.errors.length} issue(s):`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`Performance budget audit passed for ${result.urls.length} sitemap URLs.`);
    console.log(`Largest HTML: ${result.largestHtml.bytes} bytes (${result.largestHtml.url}).`);
    console.log(`Local scripts checked: ${result.checkedScripts.size}. Budgets: HTML <= ${MAX_HTML_BYTES} B, JS <= ${MAX_JS_BYTES} B, optimized hero <= ${MAX_OPTIMIZED_HERO_BYTES} B.`);
  }
}
