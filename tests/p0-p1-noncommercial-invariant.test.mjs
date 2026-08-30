import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const CRITICAL_PUBLIC_ROUTES = [
  'ayuda-urgente.html',
  'alguien-cercano-ha-intentado-suicidarse/index.html',
];

const FORBIDDEN_COMMERCIAL_PATTERNS = [
  /adsbygoogle/i,
  /pagead2\.googlesyndication\.com/i,
  /data-ad-client/i,
  /data-ad-slot/i,
  /amazon-adsystem/i,
  /doubleclick\.net/i,
  /affiliate/i,
  /afiliad[oa]/i,
  /patrocinad[oa]/i,
  /\bcomprar\b/i,
  /\boferta comercial\b/i,
];

test('P0/P1 public routes remain non-commercial by construction', async () => {
  for (const route of CRITICAL_PUBLIC_ROUTES) {
    const html = await readFile(new URL(`../${route}`, import.meta.url), 'utf8');
    for (const pattern of FORBIDDEN_COMMERCIAL_PATTERNS) {
      assert.equal(pattern.test(html), false, `${route} contains forbidden commercial marker ${pattern}`);
    }
  }
});

test('P0/P1 suicide-support route preserves official emergency access', async () => {
  const html = await readFile(new URL('../alguien-cercano-ha-intentado-suicidarse/index.html', import.meta.url), 'utf8');
  assert.match(html, /href=['"]tel:112['"]/i);
  assert.match(html, /href=['"]tel:024['"]/i);
  assert.match(html, /sanidad\.gob\.es\/linea024/i);
});
