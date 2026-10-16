import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { readFile } from 'node:fs/promises';
import { readBusinessMetrics, validateSearchConsoleSnapshot, loadSearchConsoleSnapshot } from '../src/ops-business-metrics.js';
import { capabilityForOpsRoute, buildOpsAuthorizationContext } from '../src/ops-authz.js';
import { OPS_CAPABILITIES } from '../src/ops-rbac.js';

const now = new Date('2026-10-16T14:30:00Z');
const seoFixture = { source: 'google_search_console', property: 'sc-domain:desgracias.es', search_type: 'web', period: { from: '2026-09-01', to: '2026-10-01' }, exported_at: '2026-10-15T12:00:00Z', clicks: 3, impressions: 20 };
test('manual Search Console export validates and projects aggregate metrics only', async () => {
  const report = await readBusinessMetrics(null, now, { searchConsoleSnapshot: { ...seoFixture, private_extra: 'do-not-project' } });
  assert.equal(report.clicks.value, 3);
  assert.equal(report.impressions.value, 20);
  assert.equal(report.clicks.refresh, 'manual');
  assert.equal(report.pageviews.value, null);
  assert.doesNotMatch(JSON.stringify(report), /do-not-project|sc-domain/);
  for (const patch of [{ source: 'other' }, { property: 'sc-domain:other.es' }, { search_type: 'image' }, { clicks: 21 }, { clicks: '3' }, { impressions: -1 }, { exported_at: '2026-02-30T10:00:00Z' }, { exported_at: '2027-01-01T00:00:00Z' }, { period: { from: '2026-02-30', to: '2026-10-01' } }, { period: { from: '2026-10-02', to: '2026-10-01' } }]) {
    assert.equal(validateSearchConsoleSnapshot({ ...seoFixture, ...patch }, now), null);
  }
  assert.equal(await loadSearchConsoleSnapshot(), null);
  assert.equal(await loadSearchConsoleSnapshot('missing-file-that-does-not-exist.json'), null);
});
test('reads only aggregate pageviews over seven complete UTC days', async () => {
  const pool = { query: async (sql, args) => {
    assert.deepEqual(args, ['2026-10-09', '2026-10-16']);
    assert.match(sql, /sum\(pageviews\)/);
    assert.doesNotMatch(sql, /select\s+\*|group by path/i);
    return { rows: [{ pageviews: '123', days_with_data: 4 }] };
  } };
  const result = await readBusinessMetrics(pool, now);
  assert.equal(result.pageviews.value, 123);
  assert.equal(result.pageviews.days_with_data, 4);
  assert.equal(result.coverage, 'partial');
  for (const key of ['impressions', 'clicks', 'requests', 'leads', 'conversions', 'revenue']) {
    assert.equal(result[key].value, null);
    assert.equal(result[key].status, 'BLOQUEADO');
  }
});

test('missing database, missing rows, failed query and unsafe numbers never become zero', async () => {
  for (const pool of [null,
    { query: async () => ({ rows: [{ pageviews: null, days_with_data: 0 }] }) },
    { query: async () => { throw new Error('private database detail'); } },
    { query: async () => ({ rows: [{ pageviews: '9007199254740993', days_with_data: 1 }] }) }
  ]) {
    const result = await readBusinessMetrics(pool, now);
    assert.equal(result.pageviews.value, null);
    assert.equal(result.pageviews.status, 'BLOQUEADO');
    assert.doesNotMatch(JSON.stringify(result), /private database detail/);
  }
});

test('invalid database types cannot coerce to recorded zero', async () => {
  for (const value of ['', false, true, 0, ' ', '1.2', '-1']) {
    const result = await readBusinessMetrics({ query: async () => ({ rows: [{ pageviews: value, days_with_data: 1 }] }) }, now);
    assert.equal(result.pageviews.value, null);
  }
});

test('HTTP endpoint enforces staging authentication and non-cacheable blocked data', async () => {
  for (const environment of ['staging', 'production']) {
    const portServer = createServer();
    await new Promise(resolve => portServer.listen(0, '127.0.0.1', resolve));
    const port = portServer.address().port;
    await new Promise(resolve => portServer.close(resolve));
    const child = spawn(process.execPath, ['src/ops-api.js'], {
      cwd: new URL('..', import.meta.url),
      env: { ...process.env, NODE_ENV: environment, OPS_PORT: String(port), STAGING_OPS_TOKEN: 'test-only-ops-token', DATABASE_URL: '', OPS_SEARCH_CONSOLE_SNAPSHOT: '' },
      stdio: ['ignore', 'ignore', 'pipe']
    });
    let startupError = '';
    child.stderr.on('data', chunk => { startupError += String(chunk); });
    const base = `http://127.0.0.1:${port}`;
    try {
      let ready = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        try { if ((await fetch(`${base}/health`)).ok) { ready = true; break; } } catch {}
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      assert.equal(ready, true, `Ops process started: ${startupError}`);
      const denied = await fetch(`${base}/ops/business-metrics`);
      assert.equal(denied.status, environment === 'staging' ? 401 : 404);
      const response = await fetch(`${base}/ops/business-metrics`, { headers: { Authorization: 'Bearer test-only-ops-token' } });
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.match(response.headers.get('x-robots-tag'), /noindex/);
      assert.equal(response.status, environment === 'staging' ? 200 : 404);
      if (environment === 'staging') {
        const result = await response.json();
        assert.equal(result.pageviews.value, null);
        assert.equal(result.pageviews.status, 'BLOQUEADO');
      }
    } finally {
      const stopped = new Promise(resolve => child.once('exit', resolve));
      child.kill();
      await stopped;
    }
  }
});

test('business metrics requires existing summary capability and authenticated staging token', () => {
  assert.equal(capabilityForOpsRoute('GET', '/ops/business-metrics'), OPS_CAPABILITIES.SUMMARY_READ);
  assert.equal(buildOpsAuthorizationContext({ method: 'GET', route: '/ops/business-metrics' }).allowed, false);
});

test('UI renders missing values as blocked, including after a previously successful refresh', async () => {
  const source = await readFile(new URL('../ops/ops.js', import.meta.url), 'utf8');
  const fn = source.slice(source.indexOf('function renderBusinessMetrics('), source.indexOf('async function loadBusinessMetrics('));
  const nodes = new Map();
  const context = { Intl, Number, formatDate: () => 'fecha', document: { querySelector: id => {
    if (!nodes.has(id)) nodes.set(id, {});
    return nodes.get(id);
  } } };
  vm.createContext(context);
  vm.runInContext(fn, context);
  context.renderBusinessMetrics({ pageviews: { status: 'REGISTRADO', value: 12, days_with_data: 2 } });
  assert.equal(nodes.get('#businessPageviews').textContent, '12');
  context.renderBusinessMetrics(null);
  assert.equal(nodes.get('#businessPageviews').textContent, 'BLOQUEADO');
  context.renderBusinessMetrics({ pageviews: { status: 'REGISTRADO', value: null } });
  assert.equal(nodes.get('#businessPageviews').textContent, 'BLOQUEADO');
});
