#!/usr/bin/env node

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_TIMEOUT_MS = 5000;

function normalizeBaseUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) throw new Error('OPS_BASE_URL is required');
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('OPS_BASE_URL must use http or https');
  if (url.username || url.password) throw new Error('OPS_BASE_URL must not contain credentials');
  url.pathname = url.pathname.replace(/\/+$/, '');
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

function assertHeader(headers, name, predicate, message) {
  const value = headers.get(name) || '';
  if (!predicate(value)) throw new Error(message || `${name} header is invalid`);
}

async function readJson(response, label) {
  try {
    return await response.json();
  } catch {
    throw new Error(`${label} returned invalid JSON`);
  }
}

export async function auditOpsReadiness({ baseUrl, fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS, requireBusinessMetrics = false } = {}) {
  const base = normalizeBaseUrl(baseUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const healthResponse = await fetchImpl(`${base}/health`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    });
    if (!healthResponse.ok) throw new Error(`/health failed with HTTP ${healthResponse.status}`);
    assertHeader(
      healthResponse.headers,
      'cache-control',
      (value) => value.toLowerCase().includes('no-store'),
      '/health must be non-cacheable'
    );
    assertHeader(
      healthResponse.headers,
      'x-robots-tag',
      (value) => value.toLowerCase().includes('noindex'),
      '/health must be excluded from indexing'
    );
    const health = await readJson(healthResponse, '/health');
    if (health.status !== 'ok') throw new Error('/health status is not ok');
    if (health.service !== 'desgracias-ops-api') throw new Error('/health service identity mismatch');
    if (health.environment !== 'staging') throw new Error('/health environment must be staging');
    if (!health.timestamp || Number.isNaN(Date.parse(health.timestamp))) {
      throw new Error('/health timestamp is missing or invalid');
    }

    const readyResponse = await fetchImpl(`${base}/ready`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    });
    if (!readyResponse.ok) throw new Error(`/ready failed with HTTP ${readyResponse.status}`);
    assertHeader(
      readyResponse.headers,
      'cache-control',
      (value) => value.toLowerCase().includes('no-store'),
      '/ready must be non-cacheable'
    );
    assertHeader(
      readyResponse.headers,
      'x-robots-tag',
      (value) => value.toLowerCase().includes('noindex'),
      '/ready must be excluded from indexing'
    );
    const ready = await readJson(readyResponse, '/ready');
    if (ready.status !== 'ready') throw new Error('/ready status is not ready');
    if (ready.database !== 'ok') throw new Error('/ready database is not ok');
    if (ready.ops_auth !== 'configured') throw new Error('/ready ops_auth is not configured');

    let businessMetrics;
    if (requireBusinessMetrics) {
      const response = await fetchImpl(`${base}/ops/business-metrics`, {
        method: 'GET', cache: 'no-store', signal: controller.signal
      });
      if (response.status !== 401) throw new Error(`/ops/business-metrics must reject anonymous access with HTTP 401; received HTTP ${response.status}`);
      assertHeader(response.headers, 'cache-control', value => value.toLowerCase().includes('no-store'), '/ops/business-metrics must be non-cacheable');
      assertHeader(response.headers, 'x-robots-tag', value => value.toLowerCase().includes('noindex'), '/ops/business-metrics must be excluded from indexing');
      businessMetrics = { route_available:true, unauthenticated_status:401, data_verified:false };
    }

    return {
      ok: true,
      base_url: base,
      ...(businessMetrics ? { business_metrics:businessMetrics } : {}),
      health: {
        status: health.status,
        service: health.service,
        environment: health.environment,
        timestamp: health.timestamp
      },
      readiness: {
        status: ready.status,
        database: ready.database,
        ops_auth: ready.ops_auth
      }
    };
  } finally {
    clearTimeout(timer);
  }
}

export { normalizeBaseUrl };

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isCli) {
  auditOpsReadiness({
    baseUrl: process.env.OPS_BASE_URL,
    timeoutMs: Number(process.env.OPS_AUDIT_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
    requireBusinessMetrics: process.env.OPS_REQUIRE_BUSINESS_METRICS === '1'
  })
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`OPS readiness audit failed: ${error.message}\n`);
      process.exitCode = 1;
    });
}
