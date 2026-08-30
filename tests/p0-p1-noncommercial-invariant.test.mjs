import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const CRITICAL_PUBLIC_ROUTES = [
  'ayuda-urgente.html',
  'me-preocupa-que-alguien-pueda-suicidarse/index.html',
  'alguien-cercano-ha-intentado-suicidarse/index.html',
  'mi-pareja-me-maltrata-y-no-se-que-hacer/index.html',
  'he-sufrido-una-agresion-sexual-y-no-se-que-hacer/index.html',
  'duelo/ha-muerto-por-suicidio-alguien-que-quiero/index.html',
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

test('P0/P1 suicide-support routes preserve official emergency access', async () => {
  const suicideSupportRoutes = [
    'me-preocupa-que-alguien-pueda-suicidarse/index.html',
    'alguien-cercano-ha-intentado-suicidarse/index.html',
    'duelo/ha-muerto-por-suicidio-alguien-que-quiero/index.html',
  ];

  for (const route of suicideSupportRoutes) {
    const html = await readFile(new URL(`../${route}`, import.meta.url), 'utf8');
    assert.match(html, /href=['\"]tel:112['\"]/i, `${route} must preserve 112 access`);
    assert.match(html, /href=['\"]tel:024['\"]/i, `${route} must preserve 024 access`);
    assert.match(html, /sanidad\.gob\.es\/linea024/i, `${route} must preserve the official Ministry of Health 024 source`);
  }
});
