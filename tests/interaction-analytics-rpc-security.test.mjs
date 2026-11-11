import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(new URL(
  '../supabase/migrations/20261111115836_close_unused_interaction_rpc.sql',
  import.meta.url,
), 'utf8');

test('legacy interaction writer is closed to browser-facing roles', () => {
  assert.match(migration, /^begin;/);
  assert.match(
    migration,
    /to_regprocedure\(\s*'public\.record_privacy_safe_interaction\(text,text,text,text\)'\s*\)/,
  );
  assert.match(migration, /if v_function is null then\s+return;/);
  assert.match(
    migration,
    /revoke all on function %s from public, anon, authenticated/,
  );
  assert.match(migration, /grant execute on function %s to service_role/);
  assert.match(migration, /No current runtime consumer; server-side service access only/);
  assert.match(migration, /commit;\s*$/);
});

test('production code does not call the retired interaction RPC', () => {
  const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((file) => /\.(?:html|js|mjs|ts)$/.test(file))
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('supabase/migrations/'));

  const consumers = trackedFiles.filter((file) =>
    readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
      .includes('record_privacy_safe_interaction'),
  );

  assert.deepEqual(consumers, []);
});
