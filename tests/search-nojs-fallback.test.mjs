import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const searchPage = path.join(repoRoot, 'buscar', 'index.html');

async function noScriptMarkup() {
  const html = await readFile(searchPage, 'utf8');
  const match = html.match(/<noscript>([\s\S]*?)<\/noscript>/i);
  assert.ok(match, 'La búsqueda debe conservar un fallback sin JavaScript');
  return match[1];
}

test('el fallback sin JavaScript conserva ayuda oficial inmediata', async () => {
  const source = await noScriptMarkup();
  assert.match(source, /peligro inmediato[^<]*112/i);
  assert.match(source, /pensando en suicidarte[^<]*te preocupa que alguien[^<]*024/i);
  assert.match(source, /016[^<]*todas las formas de violencia contra las mujeres/i);
  assert.match(source, /href="tel:112"[^>]*>Llamar al 112</i);
  assert.match(source, /href="tel:024"[^>]*>Llamar al 024</i);
  assert.match(source, /href="tel:016"[^>]*>Llamar al 016</i);
});

test('el fallback ofrece rutas locales útiles sin recoger datos', async () => {
  const source = await noScriptMarkup();
  const routes = [
    '/ayuda-urgente.html',
    '/me-preocupa-que-alguien-pueda-suicidarse/',
    '/alguien-cercano-ha-intentado-suicidarse/',
    '/duelo/ha-muerto-por-suicidio-alguien-que-quiero/'
  ];
  for (const route of routes) {
    assert.match(source, new RegExp(`href="${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'i'));
    const relative = route.replace(/^\//, '');
    await access(path.join(repoRoot, relative.endsWith('/') ? relative + 'index.html' : relative));
  }
  assert.match(source, /href="\/"/i);
  assert.doesNotMatch(source, /<form\b|<input\b|<textarea\b|<script\b/i);
  assert.doesNotMatch(source, /https?:\/\//i);
  assert.doesNotMatch(source, /\son[a-z]+\s*=|afiliad|monetiza|suscríb|cuenta tu historia|envíanos/i);
});

test('el fallback mantiene una estructura accesible y prioriza la urgencia', async () => {
  const html = await readFile(searchPage, 'utf8');
  const source = await noScriptMarkup();
  assert.equal((html.match(/<noscript>/gi) || []).length, 1);
  assert.ok(html.indexOf('<noscript>') < html.indexOf('<form id="search-form"'), 'El fallback debe preceder al formulario');
  assert.match(source, /<style>#search-form\{display:none\}<\/style>/i);
  assert.match(source, /<section[^>]+class="result urgent"[^>]+aria-labelledby="nojs-title"/i);
  assert.match(source, /<h2 id="nojs-title">La búsqueda necesita JavaScript<\/h2>/i);
  assert.match(source, /<ul>[\s\S]*<li>[\s\S]*<\/ul>/i);
  assert.doesNotMatch(html.match(/<form id="search-form"[\s\S]*?<\/form>/i)?.[0] || '', /\baction\s*=|<(?:input|textarea)[^>]+\bname\s*=/i);
});
