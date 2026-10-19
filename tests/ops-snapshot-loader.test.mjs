import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadSearchConsoleSnapshot, loadAdtractionSnapshot, loadAwinSnapshot } from '../src/ops-business-metrics.js';

async function withFile(content, run) {
  const dir = await mkdtemp(join(tmpdir(), 'ops-snapshot-'));
  const file = join(dir, 'snapshot.json');
  try { await writeFile(file, content); await run(file, dir); }
  finally { await rm(dir, { recursive: true, force: true }); }
}

test('all network loaders accept valid UTF-8 JSON and the exact byte limit', async () => {
  for (const load of [loadSearchConsoleSnapshot, loadAdtractionSnapshot, loadAwinSnapshot]) {
    const valid = JSON.stringify({ label: 'España' });
    await withFile(valid, async file => assert.deepEqual(await load(file), { label: 'España' }));
    await withFile('{}' + ' '.repeat(16382), async file => assert.deepEqual(await load(file), {}));
  }
});

test('oversized ASCII and multibyte files fail closed by bytes, not characters', async () => {
  for (const content of ['{}' + ' '.repeat(16383), JSON.stringify({ label: 'é'.repeat(9000) }), '{}'+ ' '.repeat(1024 * 1024)]) {
    await withFile(content, async file => assert.equal(await loadSearchConsoleSnapshot(file), null));
  }
});

test('invalid UTF-8, malformed JSON, missing files and non-files fail closed', async () => {
  const invalid = Buffer.concat([Buffer.from('{"label":"'), Buffer.from([0xc3, 0x28]), Buffer.from('"}')]);
  for (const content of [invalid, '{', '']) {
    await withFile(content, async (file, dir) => {
      assert.equal(await loadSearchConsoleSnapshot(file), null);
      assert.equal(await loadSearchConsoleSnapshot(dir), null);
      assert.equal(await loadSearchConsoleSnapshot(join(dir, 'missing.json')), null);
    });
  }
  assert.equal(await loadSearchConsoleSnapshot(undefined), null);
});
