import {
  OWN_HOSTS,
  classifyExternalLink,
  externalAnchorLinks,
  readCriticalRouteHtml,
  readCriticalRoutes,
  redirectTargetIsGoverned,
} from './lib/p0-p1-resource-policy.mjs';

if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  throw new Error('TLS verification must never be disabled for the P0/P1 resource monitor.');
}

const STRICT = process.argv.includes('--strict');
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 6;
const MAX_ATTEMPTS = 2;
const CONCURRENCY = 4;
const PROBE_PROFILES = [
  {
    name: 'monitor',
    userAgent: 'Desgracias-P0P1-Resource-Monitor/1.0 (+https://desgracias.es/)',
  },
  {
    // Some public sites return bot-specific 404s to monitoring UAs while the
    // same public page remains available to ordinary browsers. The retry keeps
    // strict TLS and redirect governance; only the request profile changes.
    name: 'browser-compatible',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
  },
];
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const REACHABLE_RESTRICTED = new Set([401, 403, 405, 429]);
const GONE_STATUSES = new Set([404, 410]);

function errorDetails(error) {
  const cause = error?.cause ?? {};
  const code = String(cause.code ?? error?.code ?? 'UNKNOWN');
  const message = String(error?.message ?? error);
  const tlsFailure = /CERT_|TLS|SSL|UNABLE_TO_VERIFY|SELF_SIGNED|DEPTH_ZERO/i.test(`${code} ${message}`);
  return { code, message, tlsFailure };
}

async function inventoryResources() {
  const routes = await readCriticalRoutes();
  const resources = new Map();

  for (const route of routes) {
    const html = await readCriticalRouteHtml(route);
    for (const { href } of externalAnchorLinks(html)) {
      const url = new URL(href);
      if (OWN_HOSTS.has(url.hostname.toLowerCase())) continue;

      const classification = classifyExternalLink(href);
      const existing = resources.get(href) ?? {
        href,
        classification: classification.kind,
        routes: [],
      };
      existing.routes.push(route);
      resources.set(href, existing);
    }
  }

  return [...resources.values()].map((entry) => ({
    ...entry,
    routes: [...new Set(entry.routes)].sort(),
  }));
}

async function fetchOne(url, userAgent) {
  const startedAt = Date.now();
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'user-agent': userAgent,
      accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.2',
      'accept-language': 'es-ES,es;q=0.8,en;q=0.3',
    },
  });

  const elapsedMs = Date.now() - startedAt;
  return { response, elapsedMs };
}

async function probeAttempt(resource, profile) {
  if (['escape', '016_whatsapp'].includes(resource.classification)) {
    return {
      state: 'skipped_special_transport',
      severity: 'info',
      final_url: resource.href,
      redirect_chain: [],
      status: null,
      elapsed_ms: null,
      probe_profile: profile.name,
    };
  }

  let current = resource.href;
  const redirectChain = [];
  let totalElapsedMs = 0;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    let response;
    let elapsedMs;

    try {
      ({ response, elapsedMs } = await fetchOne(current, profile.userAgent));
    } catch (error) {
      const details = errorDetails(error);
      return {
        state: details.tlsFailure ? 'tls_failure' : 'transient_network_failure',
        severity: details.tlsFailure ? 'hard' : 'warning',
        final_url: current,
        redirect_chain: redirectChain,
        status: null,
        elapsed_ms: totalElapsedMs || null,
        error_code: details.code,
        error: details.message,
        probe_profile: profile.name,
      };
    }

    totalElapsedMs += elapsedMs;
    const status = response.status;

    if (REDIRECT_STATUSES.has(status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();

      if (!location) {
        return {
          state: 'redirect_without_location',
          severity: 'hard',
          final_url: current,
          redirect_chain: redirectChain,
          status,
          elapsed_ms: totalElapsedMs,
          probe_profile: profile.name,
        };
      }

      const target = new URL(location, current).href;
      redirectChain.push({ status, from: current, to: target });

      if (!redirectTargetIsGoverned(resource.href, { kind: resource.classification }, target)) {
        return {
          state: 'ungoverned_redirect',
          severity: 'hard',
          final_url: target,
          redirect_chain: redirectChain,
          status,
          elapsed_ms: totalElapsedMs,
          probe_profile: profile.name,
        };
      }

      current = target;
      continue;
    }

    await response.body?.cancel();

    if (status >= 200 && status < 400) {
      return {
        state: 'healthy',
        severity: 'ok',
        final_url: current,
        redirect_chain: redirectChain,
        status,
        elapsed_ms: totalElapsedMs,
        probe_profile: profile.name,
      };
    }

    if (REACHABLE_RESTRICTED.has(status)) {
      return {
        state: 'reachable_restricted',
        severity: 'warning',
        final_url: current,
        redirect_chain: redirectChain,
        status,
        elapsed_ms: totalElapsedMs,
        probe_profile: profile.name,
      };
    }

    if (GONE_STATUSES.has(status)) {
      return {
        state: 'resource_missing',
        severity: 'hard',
        final_url: current,
        redirect_chain: redirectChain,
        status,
        elapsed_ms: totalElapsedMs,
        probe_profile: profile.name,
      };
    }

    return {
      state: status >= 500 ? 'transient_server_failure' : 'http_warning',
      severity: 'warning',
      final_url: current,
      redirect_chain: redirectChain,
      status,
      elapsed_ms: totalElapsedMs,
      probe_profile: profile.name,
    };
  }

  return {
    state: 'too_many_redirects',
    severity: 'hard',
    final_url: current,
    redirect_chain: redirectChain,
    status: null,
    elapsed_ms: totalElapsedMs,
    probe_profile: profile.name,
  };
}

async function probeResource(resource) {
  const attempts = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const profile = PROBE_PROFILES[Math.min(attempt - 1, PROBE_PROFILES.length - 1)];
    const result = await probeAttempt(resource, profile);
    attempts.push({ attempt, ...result });

    if (['ok', 'info'].includes(result.severity)) break;
    if (result.state === 'reachable_restricted') break;
  }

  const finalAttempt = attempts.at(-1);
  const recovered = attempts.some((item) => item.severity !== 'ok') && finalAttempt.severity === 'ok';

  return {
    ...resource,
    ...finalAttempt,
    recovered_after_retry: recovered,
    attempts,
  };
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

const inventory = await inventoryResources();
const results = await mapLimit(inventory, CONCURRENCY, probeResource);
const hardFailures = results.filter((item) => item.severity === 'hard');
const warnings = results.filter((item) => item.severity === 'warning');
const healthy = results.filter((item) => item.severity === 'ok');
const skipped = results.filter((item) => item.severity === 'info');

const report = {
  generated_at: new Date().toISOString(),
  mode: STRICT ? 'strict-scheduled-alert' : 'soft-evidence',
  policy: 'P0/P1 external resources; scheduled operational monitor, never a required deployment gate',
  summary: {
    total: results.length,
    healthy: healthy.length,
    warnings: warnings.length,
    hard_failures: hardFailures.length,
    skipped_special_transport: skipped.length,
  },
  results,
};

console.log(JSON.stringify(report, null, 2));

if (hardFailures.length > 0) {
  console.error(`P0/P1 resource monitor found ${hardFailures.length} hard failure(s).`);
  for (const item of hardFailures) {
    console.error(`- ${item.href} state=${item.state} final=${item.final_url} routes=${item.routes.join(',')}`);
  }
  if (STRICT) process.exitCode = 1;
}
