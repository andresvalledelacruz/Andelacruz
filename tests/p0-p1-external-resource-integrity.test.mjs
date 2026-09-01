import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OWN_HOSTS,
  PUBLIC_AUTHORITY_BASE_DOMAINS,
  REVIEWED_NON_GOVERNMENT_HOSTS,
  TRACKING_QUERY_KEYS,
  classifyExternalLink,
  externalAnchorLinks,
  readCriticalRouteHtml,
  readCriticalRoutes,
} from '../scripts/lib/p0-p1-resource-policy.mjs';

test('P0/P1 external resources stay HTTPS, non-tracked and source-governed', async () => {
  const routes = await readCriticalRoutes();
  let externalCount = 0;

  for (const route of routes) {
    const html = await readCriticalRouteHtml(route);
    const links = externalAnchorLinks(html);

    for (const { href, tag } of links) {
      const url = new URL(href);
      if (OWN_HOSTS.has(url.hostname.toLowerCase())) continue;

      externalCount += 1;
      assert.equal(url.protocol, 'https:', `${route} contains a non-HTTPS external anchor: ${href}`);

      for (const key of url.searchParams.keys()) {
        assert.equal(TRACKING_QUERY_KEYS.test(key), false, `${route} contains tracking parameter ${key} in ${href}`);
      }

      const classification = classifyExternalLink(href);
      assert.notEqual(classification.kind, 'own');

      if (classification.kind === 'escape') {
        assert.match(tag, /rel\s*=\s*(['"])[^'"<>]*noopener[^'"<>]*\1/i, 'Quick-exit destination must isolate opener access');
        assert.match(tag, /rel\s*=\s*(['"])[^'"<>]*noreferrer[^'"<>]*\1/i, 'Quick-exit destination must suppress referrer via rel');
        assert.match(tag, /referrerpolicy\s*=\s*(['"])no-referrer\1/i, 'Quick-exit destination must suppress the referrer');
      }

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
