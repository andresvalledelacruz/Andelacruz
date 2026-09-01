import { readFile } from 'node:fs/promises';

export const OWN_HOSTS = new Set(['desgracias.es', 'www.desgracias.es']);

export const PUBLIC_AUTHORITY_BASE_DOMAINS = [
  'sanidad.gob.es',
  'guiasalud.es',
  'who.int',
  'juntadeandalucia.es',
  'gobiernodecanarias.org',
  'comunidad.madrid',
  'igualdad.gob.es',
  'mjusticia.gob.es',
  'policia.es',
  'boe.es',
  'ine.es',
  'nhs.uk',
  'euskadi.eus',
  'gencat.cat',
];

export const REVIEWED_NON_GOVERNMENT_HOSTS = new Set([
  // Associació Tramuntana – Després del Suïcidi (TDS), reviewed 2026-09-01.
  // Canal Salut (Generalitat de Catalunya) lists TDS among survivor-support entities.
  'tdssuicidio.com',
  // Source-level review completed 2026-09-01: dedicated suicide-bereavement
  // resources from established prevention, postvention and crisis-support bodies.
  'standbysupport.com.au',
  'afsp.org',
  'www.samaritans.org',
  'www.redaipis.org',
  'papageno.es',
  'telefonodelaesperanza.org',
]);

export const TRACKING_QUERY_KEYS = /^(?:utm_.+|gclid|dclid|fbclid|msclkid|mc_cid|mc_eid|affiliate|aff|affid)$/i;

export function routeToFile(route) {
  const normalized = route.replace(/^\/+/, '');
  return normalized.endsWith('.html') ? normalized : `${normalized.replace(/\/+$/, '')}/index.html`;
}

export async function readCriticalRoutes() {
  const markdown = await readFile(new URL('../../SAFETY_ROUTE_INVENTORY.md', import.meta.url), 'utf8');
  const section = markdown.split('## P0/P1 — monetización denegada por construcción')[1]?.split('\n## ')[0] ?? '';
  const routes = [...section.matchAll(/^\|\s*`(\/[^`]+)`\s*\|/gm)].map((match) => match[1]);

  if (routes.length === 0) {
    throw new Error('SAFETY_ROUTE_INVENTORY.md must contain P0/P1 routes');
  }
  if (new Set(routes).size !== routes.length) {
    throw new Error('P0/P1 inventory routes must be unique');
  }

  return routes;
}

export async function readCriticalRouteHtml(route) {
  const file = routeToFile(route);
  return readFile(new URL(`../../${file}`, import.meta.url), 'utf8');
}

export function externalAnchorLinks(html) {
  const links = [];
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*(['"])(https?:\/\/[^'"<>]+)\1[^>]*>/gi)) {
    links.push({ href: match[2], tag: match[0] });
  }
  return links;
}

export function isAuthorityHost(hostname) {
  const normalized = hostname.toLowerCase();
  return PUBLIC_AUTHORITY_BASE_DOMAINS.some((base) => normalized === base || normalized.endsWith(`.${base}`));
}

export function classifyExternalLink(href) {
  const url = new URL(href);
  const hostname = url.hostname.toLowerCase();

  if (OWN_HOSTS.has(hostname)) return { kind: 'own' };
  if (href === 'https://www.google.com/') return { kind: 'escape' };

  if (hostname === 'wa.me') {
    if (url.protocol !== 'https:') throw new Error('016 WhatsApp must use HTTPS');
    if (url.pathname.replace(/\/$/, '') !== '/3460000016') {
      throw new Error('Only the official 016 WhatsApp number is allowed on P0/P1 routes');
    }
    if (url.search !== '') throw new Error('016 WhatsApp link must not contain query parameters');
    if (url.hash !== '') throw new Error('016 WhatsApp link must not contain a fragment');
    return { kind: '016_whatsapp' };
  }

  if (isAuthorityHost(hostname)) return { kind: 'public_authority' };
  if (REVIEWED_NON_GOVERNMENT_HOSTS.has(hostname)) return { kind: 'reviewed_non_government' };

  throw new Error(`Unreviewed external host on P0/P1 route: ${hostname} (${href})`);
}

function withoutWww(hostname) {
  return hostname.toLowerCase().replace(/^www\./, '');
}

export function redirectTargetIsGoverned(sourceHref, classification, finalHref) {
  const source = new URL(sourceHref);
  const target = new URL(finalHref);

  if (target.protocol !== 'https:') return false;
  if (withoutWww(source.hostname) === withoutWww(target.hostname)) return true;

  if (classification.kind === 'public_authority') {
    return isAuthorityHost(target.hostname);
  }

  return false;
}
