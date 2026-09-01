import tls from 'node:tls';

const CANONICAL_ORIGIN = 'https://desgracias.es/';
const TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 8;

const PUBLIC_VARIANTS = [
  'https://desgracias.es/',
  'https://www.desgracias.es/',
  'http://desgracias.es/',
  'http://www.desgracias.es/'
];

const V9_MARKERS = [
  '<title>Desgracias.es | Historias reales y recursos para momentos difíciles</title>',
  'UN ESPACIO ANÓNIMO, HUMANO Y RESPETUOSO',
  'Hay momentos',
  'dice basta.'
];

const LEGACY_WORDPRESS_MARKERS = [
  'wp-content',
  'wp-includes',
  'wordpress',
  'colormag'
];

const DNS_PROVIDERS = {
  google: {
    url(name, type) {
      return `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
    },
    headers: { accept: 'application/dns-json' }
  },
  cloudflare: {
    url(name, type) {
      return `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
    },
    headers: { accept: 'application/dns-json' }
  }
};

const DNS_TYPES = {
  A: 1,
  NS: 2,
  CNAME: 5,
  AAAA: 28
};

const checks = [];
let failures = 0;

function errorMessage(error) {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

async function runCheck(name, operation) {
  try {
    const details = await operation();
    checks.push({ name, status: 'pass', details });
    return details;
  } catch (error) {
    failures += 1;
    checks.push({ name, status: 'fail', error: errorMessage(error) });
    return null;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isRedirect(status) {
  return [301, 302, 303, 307, 308].includes(status);
}

async function fetchWithTimeout(url, options = {}) {
  return fetch(url, {
    ...options,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'user-agent': 'Desgracias-Production-Origin-Integrity/1.0',
      ...(options.headers || {})
    }
  });
}

async function tracePublicVariant(startUrl) {
  const visited = new Set();
  const chain = [];
  let currentUrl = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    assert(!visited.has(currentUrl), `redirect loop detected at ${currentUrl}`);
    visited.add(currentUrl);

    const response = await fetchWithTimeout(currentUrl, { redirect: 'manual' });
    const location = response.headers.get('location');
    chain.push({ url: currentUrl, status: response.status, location });

    if (isRedirect(response.status)) {
      assert(location, `${currentUrl} returned ${response.status} without Location`);
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    const finalUrl = new URL(currentUrl);
    const body = await response.text();

    assert(response.status >= 200 && response.status < 300, `${currentUrl} returned HTTP ${response.status}`);
    assert(finalUrl.protocol === 'https:', `${startUrl} did not finish on HTTPS`);
    assert(finalUrl.hostname === 'desgracias.es', `${startUrl} finished on non-canonical host ${finalUrl.hostname}`);
    assert(finalUrl.pathname === '/', `${startUrl} finished on unexpected path ${finalUrl.pathname}`);

    if (startUrl.startsWith('http://')) {
      assert(chain.length > 1, `${startUrl} did not redirect to HTTPS`);
    }

    for (const marker of V9_MARKERS) {
      assert(body.includes(marker), `${startUrl} final body is missing V9 marker: ${marker}`);
    }

    const lowerBody = body.toLowerCase();
    for (const marker of LEGACY_WORDPRESS_MARKERS) {
      assert(!lowerBody.includes(marker), `${startUrl} final body contains legacy WordPress marker: ${marker}`);
    }

    return {
      startUrl,
      finalUrl: finalUrl.toString(),
      chain,
      bodyBytes: Buffer.byteLength(body, 'utf8'),
      v9Markers: V9_MARKERS.length,
      legacyMarkersFound: 0
    };
  }

  throw new Error(`${startUrl} exceeded ${MAX_REDIRECTS} redirects`);
}

async function inspectTls(hostname) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({
      host: hostname,
      port: 443,
      servername: hostname,
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    });

    socket.setTimeout(TIMEOUT_MS);

    socket.once('secureConnect', () => {
      try {
        assert(socket.authorized === true, `${hostname} TLS socket is not authorized: ${socket.authorizationError || 'unknown reason'}`);
        const certificate = socket.getPeerCertificate();
        assert(certificate && Object.keys(certificate).length > 0, `${hostname} did not present a peer certificate`);

        const details = {
          hostname,
          authorized: socket.authorized,
          protocol: socket.getProtocol(),
          subject: certificate.subject || null,
          issuer: certificate.issuer || null,
          validFrom: certificate.valid_from || null,
          validTo: certificate.valid_to || null,
          fingerprint256: certificate.fingerprint256 || null
        };

        socket.end();
        resolve(details);
      } catch (error) {
        socket.destroy();
        reject(error);
      }
    });

    socket.once('timeout', () => {
      socket.destroy(new Error(`${hostname} TLS handshake timed out after ${TIMEOUT_MS}ms`));
    });

    socket.once('error', reject);
  });
}

function normalizeDnsAnswers(payload, requestedType) {
  const numericType = DNS_TYPES[requestedType];
  return (payload.Answer || [])
    .filter((answer) => answer.type === numericType)
    .map((answer) => String(answer.data).replace(/\.$/, '').toLowerCase())
    .sort();
}

async function queryDns(providerName, name, type) {
  const provider = DNS_PROVIDERS[providerName];
  const response = await fetchWithTimeout(provider.url(name, type), { headers: provider.headers });
  assert(response.ok, `${providerName} DoH returned HTTP ${response.status} for ${name} ${type}`);

  const payload = await response.json();
  assert(payload.Status === 0, `${providerName} DoH returned DNS status ${payload.Status} for ${name} ${type}`);

  return {
    provider: providerName,
    name,
    type,
    answers: normalizeDnsAnswers(payload, type),
    authoritative: Boolean(payload.AD)
  };
}

function sameSet(left, right) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

const dnsEvidence = new Map();
const dnsQueries = [
  ['desgracias.es', 'A'],
  ['desgracias.es', 'AAAA'],
  ['desgracias.es', 'NS'],
  ['www.desgracias.es', 'CNAME'],
  ['www.desgracias.es', 'A'],
  ['www.desgracias.es', 'AAAA']
];

for (const hostname of ['desgracias.es', 'www.desgracias.es']) {
  await runCheck(`TLS chain ${hostname}`, () => inspectTls(hostname));
}

for (const publicUrl of PUBLIC_VARIANTS) {
  await runCheck(`Public origin ${publicUrl}`, () => tracePublicVariant(publicUrl));
}

for (const [name, type] of dnsQueries) {
  for (const providerName of Object.keys(DNS_PROVIDERS)) {
    const key = `${providerName}:${name}:${type}`;
    const evidence = await runCheck(`DNS ${providerName} ${name} ${type}`, () => queryDns(providerName, name, type));
    if (evidence) dnsEvidence.set(key, evidence);
  }
}

for (const [name, type] of dnsQueries) {
  await runCheck(`DNS resolver consensus ${name} ${type}`, async () => {
    const google = dnsEvidence.get(`google:${name}:${type}`);
    const cloudflare = dnsEvidence.get(`cloudflare:${name}:${type}`);
    assert(google && cloudflare, `missing resolver evidence for ${name} ${type}`);
    assert(sameSet(google.answers, cloudflare.answers), `Google and Cloudflare disagree for ${name} ${type}: ${google.answers.join(', ') || '(empty)'} vs ${cloudflare.answers.join(', ') || '(empty)'}`);

    return {
      name,
      type,
      answers: google.answers,
      resolvers: ['google', 'cloudflare']
    };
  });
}

await runCheck('DNS apex has an address', async () => {
  const googleA = dnsEvidence.get('google:desgracias.es:A')?.answers || [];
  const googleAAAA = dnsEvidence.get('google:desgracias.es:AAAA')?.answers || [];
  assert(googleA.length + googleAAAA.length > 0, 'desgracias.es has no A or AAAA answer from Google DoH');
  return { A: googleA, AAAA: googleAAAA };
});

await runCheck('DNS apex has nameservers', async () => {
  const nameservers = dnsEvidence.get('google:desgracias.es:NS')?.answers || [];
  assert(nameservers.length > 0, 'desgracias.es has no NS answers from Google DoH');
  return { NS: nameservers };
});

await runCheck('DNS www resolves', async () => {
  const cname = dnsEvidence.get('google:www.desgracias.es:CNAME')?.answers || [];
  const A = dnsEvidence.get('google:www.desgracias.es:A')?.answers || [];
  const AAAA = dnsEvidence.get('google:www.desgracias.es:AAAA')?.answers || [];
  assert(cname.length + A.length + AAAA.length > 0, 'www.desgracias.es has no CNAME, A or AAAA answer from Google DoH');
  return { CNAME: cname, A, AAAA };
});

const report = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  canonicalOrigin: CANONICAL_ORIGIN,
  tlsPolicy: 'strict-system-trust-store-no-bypass',
  resolverPolicy: 'google-doh-plus-cloudflare-doh-consensus',
  status: failures === 0 ? 'pass' : 'fail',
  failures,
  checks
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

if (failures > 0) process.exitCode = 1;
