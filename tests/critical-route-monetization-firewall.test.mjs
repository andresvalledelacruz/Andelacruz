import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { isCriticalRoutePath } from '../scripts/critical-route-signals.mjs';

const ROOT = new URL('../', import.meta.url);
const SKIP_DIRS = new Set(['.git', 'node_modules', 'ops']);

async function collectHtml(dir = ROOT) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const next = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, dir);
    if (entry.isDirectory()) files.push(...await collectHtml(next));
    else if (entry.name.endsWith('.html')) files.push(next);
  }
  return files;
}

function repoPath(url) {
  return decodeURIComponent(url.pathname).split('/').slice(-20).join('/').replace(/^.*\/Andelacruz\//, '');
}

const hardMonetizationSignals = [
  /adsbygoogle/i,
  /googlesyndication\.com/i,
  /doubleclick\.net/i,
  /data-ad-client\s*=/i,
  /data-ad-slot\s*=/i,
  /rel=["'][^"']*sponsored/i,
  /(?:href|action)=["'][^"']*(?:stripe\.com|paypal\.com|checkout\.com|buy\.stripe\.com)/i,
  /(?:href|action)=["'][^"']*[?&](?:aff|affiliate|referral|utm_source=affiliate)(?:=|&|["'])/i,
];

const commercialCtaSignals = [
  /<(?:a|button)\b[^>]*>\s*(?:comprar|compra ahora|contratar|ver precios?|obtener oferta|hazte premium|suscr[ií]bete premium)\b/i,
];

test('las rutas P0/P1 publicadas permanecen libres de monetización y CTA comercial', async () => {
  const htmlFiles = await collectHtml();
  const critical = htmlFiles.filter((file) => isCriticalRoutePath(repoPath(file)));
  assert.ok(critical.length > 0, 'debe existir al menos una ruta crítica publicada para auditar');

  for (const file of critical) {
    const html = await readFile(file, 'utf8');
    const relative = repoPath(file);
    for (const pattern of [...hardMonetizationSignals, ...commercialCtaSignals]) {
      assert.doesNotMatch(html, pattern, `${relative} contiene una señal de monetización/CTA comercial prohibida: ${pattern}`);
    }
  }
});
