import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const OWN_HOSTS = new Set(['desgracias.es', 'www.desgracias.es']);

const PUBLIC_AUTHORITY_BASE_DOMAINS = [
  'sanidad.gob.es',
  'guiasalud.es',
  'who.int',
  'juntadeandalucia.es',
  'gobiernodecanarias.org',
  'igualdad.gob.es',
  'mjusticia.gob.es',
  'policia.es',
  'boe.es',
  'ine.es',
  'nhs.uk',
];

const REVIEWED_NON_GOVERNMENT_HOSTS = new Set([
  // Add a host only after source-level review of the organisation and the
  // exact reason it is useful on a P0/P1 route. Do not add broad wildcards.
]);

const TRACKING_QUERY_KEYS = /^(?:utm_.+|gclid|dclid|fbclid|msclkid|mc_cid|mc_eid|affiliate|aff|affid)$/i;

function routeToFile(route) {
  const normalized = route.replace(/^\/+/, '');
  return normalized.endsWith('.html') ? normalized : `${normalized.replace(/\/+$/, '')}/index.html`;
}

async function readCriticalRoutes() {
  const markdown = await readFile(new URL('../SAFETY_ROUTE_INVENTORY.md', import.meta.url), 'utf8');
  const section = markdown.split('## P0/P1 — monetización denegada por construcción')[1]?.split('\n## ')[0] ?? '';
  const routes = [...section.matchAll(/^\|\s*`(\/[^`]+)`\s*\|/gm)].map((match) => match[1]);
  assert.ok(routes.length > 0, 'SAFETY_ROUTE_INVENTORY.md must contain P0/P1 routes');
  assert.equal(new Set(routes).size, routes.length, 'P0/P1 inventory routes must be unique');
  return routes;
}

function externalAnchorLinks(html) {
  const links = [];
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*(['"])(https?:\/\/[^'"<>]+)\1[^>]*>/gi)) {
    links.push({ href: match[2], tag: match[0] });
  }
  return links;
}

function isAuthorityHost(hostname) {
  return PUBLIC_AUTHORITY_BASE_DOMAINS.some((base) => hostname === base || hostname.endsWith(`.${base}`));
}

function classifyExternalLink(href, tag) {
  const url = new URL(href);
  const hostname = url.hostname.toLowerCase();

  if (OWN_HOSTS.has(hostname)) return { kind: 'own' };

  if (href === 'https://www.google.com/') {
    assert.match(tag, /aria-label\s*=\s*(['"])[^'"<>]*salir[^'"<>]*\1/i, 'Google may only be used as an explicitly labelled quick-exit destination');
    assert.match(tag, /referrerpolicy\s*=\s*(['"])no-referrer\1/i, 'Quick-exit destination must suppress the referrer');
    return { kind: 'escape' };
  }

  if (hostname === 'wa.me') {
    assert.equal(url.protocol, 'https:', '016 WhatsApp must use HTTPS');
    assert.equal(url.pathname.replace(/\/$/, ''), '/3460000016', 'Only the official 016 WhatsApp number is allowed on P0/P1 routes');
    assert.equal(url.search, '', '016 WhatsApp link must not contain query parameters');
    assert.equal(url.hash, '', '016 WhatsApp link must not contain a fragment');
    return { kind: '016_whatsapp' };
  }

  if (isAuthorityHost(hostname)) return { kind: 'public_authority' };
  if (REVIEWED_NON_GOVERNMENT_HOSTS.has(hostname)) return { kind: 'reviewed_non_government' };

  throw new Error(`Unreviewed external host on P0/P1 route: ${hostname} (${href})`);
}

test('P0/P1 external resources stay HTTPS, non-tracked and source-governed', async () => {
  const routes = await readCriticalRoutes();
  let externalCount = 0;

  for (const route of routes) {
    const file = routeToFile(route);
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    const links = externalAnchorLinks(html);

    for (const { href, tag } of links) {
      const url = new URL(href);
      if (OWN_HOSTS.has(url.hostname.toLowerCase())) continue;

      externalCount += 1;
      assert.equal(url.protocol, 'https:', `${route} contains a non-HTTPS external anchor: ${href}`);

      for (const key of url.searchParams.keys()) {
        assert.equal(TRACKING_QUERY_KEYS.test(key), false, `${route} contains tracking parameter ${key} in ${href}`);
      }

      const classification = classifyExternalLink(href, tag);
      assert.notEqual(classification.kind, 'own');

      if (!['escape', '016_whatsapp'].includes(classification.kind)) {
        assert.match(tag, /rel\s*=\s*(['"])[^'"<>]*noopener[^'"<>]*\1/i, `${route} external resource must declare noopener: ${href}`);
        assert.match(tag, /rel\s*=\s*(['"])[^'"<>]*noreferrer[^'"<>]*\1/i, `${route} external resource must declare noreferrer: ${href}`);
      }
    }
  }

  assert.ok(externalCount > 0, 'P0/P1 routes must expose at least one governed external resource');
});

test('critical resource exceptions remain exact and narrow', () => {
  assert.equal(REVIEWED_NON_GOVERNMENT_HOSTS.has('*'), false);
  assert.equal(REVIEWED_NON_GOVERNMENT_HOSTS.has('com'), false);
  assert.equal(REVIEWED_NON_GOVERNMENT_HOSTS.has('org'), false);
  assert.ok(PUBLIC_AUTHORITY_BASE_DOMAINS.every((host) => !host.startsWith('.')));
});
