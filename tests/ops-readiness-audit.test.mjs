import test from 'node:test';
import assert from 'node:assert/strict';
import { auditOpsReadiness, normalizeBaseUrl } from '../scripts/audit-ops-readiness.mjs';

function headers(values = {}) {
  const normalized = new Map(Object.entries(values).map(([key, value]) => [key.toLowerCase(), value]));
  return { get(name) { return normalized.get(String(name).toLowerCase()) || null; } };
}

function response(body, { status = 200, headers: headerValues = {} } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: headers(headerValues),
    async json() { return body; }
  };
}

test('normalizes the ops base URL without leaking query or fragment', () => {
  assert.equal(normalizeBaseUrl('https://ops.example.test///?token=secret#x'), 'https://ops.example.test');
});

test('accepts healthy staging service only when liveness, readiness and security headers agree', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.endsWith('/health')) {
      return response(
        {
          status: 'ok',
          service: 'desgracias-ops-api',
          environment: 'staging',
          timestamp: '2026-08-29T01:00:00.000Z'
        },
        { headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' } }
      );
    }
    return response(
      { status: 'ready', database: 'ok', ops_auth: 'configured' },
      { headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' } }
    );
  };

  const result = await auditOpsReadiness({ baseUrl: 'https://ops.example.test/', fetchImpl });
  assert.equal(result.ok, true);
  assert.deepEqual(calls, ['https://ops.example.test/health', 'https://ops.example.test/ready']);
  assert.equal(result.readiness.database, 'ok');
});

test('fails closed when readiness reports degraded database', async () => {
  const fetchImpl = async (url) => {
    if (url.endsWith('/health')) {
      return response(
        {
          status: 'ok',
          service: 'desgracias-ops-api',
          environment: 'staging',
          timestamp: '2026-08-29T01:00:00.000Z'
        },
        { headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } }
      );
    }
    return response(
      { status: 'not_ready', database: 'error' },
      { status: 503, headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } }
    );
  };

  await assert.rejects(
    auditOpsReadiness({ baseUrl: 'https://ops.example.test', fetchImpl }),
    /\/ready failed with HTTP 503/
  );
});

test('fails when health endpoint becomes indexable or cacheable', async () => {
  const fetchImpl = async () => response(
    {
      status: 'ok',
      service: 'desgracias-ops-api',
      environment: 'staging',
      timestamp: '2026-08-29T01:00:00.000Z'
    },
    { headers: { 'cache-control': 'public, max-age=300', 'x-robots-tag': 'index' } }
  );

  await assert.rejects(
    auditOpsReadiness({ baseUrl: 'https://ops.example.test', fetchImpl }),
    /\/health must be non-cacheable/
  );
});

test('rejects a non-staging environment even if endpoint returns 200', async () => {
  const fetchImpl = async () => response(
    {
      status: 'ok',
      service: 'desgracias-ops-api',
      environment: 'production',
      timestamp: '2026-08-29T01:00:00.000Z'
    },
    { headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } }
  );

  await assert.rejects(
    auditOpsReadiness({ baseUrl: 'https://ops.example.test', fetchImpl }),
    /environment must be staging/
  );
});
