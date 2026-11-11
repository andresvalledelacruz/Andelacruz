import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const inventory = readFileSync(new URL('../SAFETY_ROUTE_INVENTORY.md', import.meta.url), 'utf8');
const migration = readFileSync(new URL(
  '../supabase/migrations/20261111085209_block_pageview_analytics_on_safety_routes.sql',
  import.meta.url
), 'utf8');

function safetyRoutes(markdown) {
  const section = markdown
    .split('## P0/P1 — monetización denegada por construcción')[1]
    ?.split('\n## ')[0] ?? '';
  return [...section.matchAll(/^\|\s*`(\/[^`]+)`\s*\|/gm)].map(match => match[1]);
}

function migrationRoutes(sql) {
  const match = sql.match(/v_critical_routes constant text\[\] := array\[([\s\S]+?)\n\s*\]::text\[\];/);
  assert.ok(match, 'the pageview deny-list is explicit');
  return [...match[1].matchAll(/'([^']+)'/g)].map(route => route[1]);
}

test('pageview RPC deny-list matches the complete Safety inventory', () => {
  assert.deepEqual(migrationRoutes(migration), safetyRoutes(inventory));
});

test('Safety paths and descendants return before the analytics insert', () => {
  const safetyCheck = migration.indexOf('from unnest(v_critical_routes)');
  const analyticsInsert = migration.indexOf('insert into public.pageview_daily_analytics');
  assert.ok(safetyCheck > 0);
  assert.ok(analyticsInsert > safetyCheck);
  assert.match(migration, /v_path = critical_route\.path/);
  assert.match(migration, /v_path like critical_route\.path \|\| '%'/);
  assert.match(migration, /v_path = left\(critical_route\.path, -1\)/);
});

test('malformed and ambiguous paths return before the analytics insert', () => {
  const pathValidation = migration.indexOf("v_path = ''");
  const analyticsInsert = migration.indexOf('insert into public.pageview_daily_analytics');
  assert.ok(pathValidation > 0);
  assert.ok(analyticsInsert > pathValidation);
  assert.match(migration, /position\('\/\/' in v_path\) > 0/);
  assert.match(migration, /position\('\.\.' in v_path\) > 0/);
  assert.match(migration, /v_path ~ '\(\^\|\/\)\\\.\(\\\/\|\$\)'/);
  assert.doesNotMatch(migration, /v_path := '\/unknown'/);
});

test('migration fails closed and preserves the aggregate privacy contract', () => {
  assert.match(migration, /^begin;/);
  assert.match(migration, /to_regprocedure\('public\.record_privacy_safe_pageview\(text,text,text,text\)'\)/);
  assert.match(migration, /security definer/);
  assert.match(migration, /set search_path = public, pg_temp/);
  assert.match(migration, /insert into public\.pageview_daily_analytics/);
  assert.match(migration, /commit;\s*$/);
});
