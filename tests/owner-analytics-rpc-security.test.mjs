import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';

const root = new URL('..', import.meta.url);
const migration=readFileSync(new URL('../supabase/migrations/20261105185227_restrict_owner_analytics_rpc.sql',import.meta.url),'utf8');
const baseline=readFileSync(new URL('../docs/SECURITY_BASELINE_RECOMMENDATION_SYSTEM.md',import.meta.url),'utf8');

function sourceFiles(directory,files=[]) {
  for(const entry of readdirSync(directory)) {
    if(['.git','node_modules','supabase','docs','tests'].includes(entry)) continue;
    const path=join(directory,entry);
    if(statSync(path).isDirectory()) sourceFiles(path,files);
    else if(/\.(?:html|js|mjs|cjs)$/.test(entry)) files.push(path);
  }
  return files;
}

test('owner analytics migration fails closed and removes public execution',()=>{
  assert.match(migration,/^begin;/);
  assert.match(migration,/to_regprocedure\('public\.get_owner_privacy_safe_analytics\(text,integer\)'\)/);
  assert.match(migration,/raise exception 'public\.get_owner_privacy_safe_analytics\(text,integer\) is missing;/);
  assert.match(migration,/revoke all on function public\.get_owner_privacy_safe_analytics\(text,integer\)\s+from public, anon, authenticated;/);
  assert.match(migration,/grant execute on function public\.get_owner_privacy_safe_analytics\(text,integer\)\s+to service_role;/);
  assert.match(migration,/commit;\s*$/);
});

test('owner analytics legacy RPC is not called by public or server runtime',()=>{
  const references = sourceFiles(root.pathname)
    .filter(path => readFileSync(path, 'utf8').includes('get_owner_privacy_safe_analytics'))
    .map(path => relative(root.pathname, path));
  assert.deepEqual(references,[]);
});

test('security baseline records the supported protected path',()=>{
  assert.match(baseline,/get_owner_privacy_safe_analytics/);
  assert.match(baseline,/protected operations backend/);
  assert.match(baseline,/`PUBLIC`, `anon` and `authenticated` must not invoke it/);
});
