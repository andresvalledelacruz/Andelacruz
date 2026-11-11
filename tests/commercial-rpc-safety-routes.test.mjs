import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const inventory = readFileSync(new URL('../SAFETY_ROUTE_INVENTORY.md', import.meta.url), 'utf8');
const migration = readFileSync(new URL(
  '../supabase/migrations/20261111075853_block_commercial_events_on_safety_routes.sql',
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
  assert.ok(match, 'the database deny-list is explicit');
  return [...match[1].matchAll(/'([^']+)'/g)].map(route => route[1]);
}

test('database commercial telemetry deny-list matches the complete Safety inventory', () => {
  assert.deepEqual(migrationRoutes(migration), safetyRoutes(inventory));
});

test('commercial telemetry rejects Safety descendants before touching an offer', () => {
  const safetyCheck = migration.indexOf("raise exception 'Commercial telemetry is forbidden on a Safety route'");
  const offerLookup = migration.indexOf('from public.partner_offers o');
  assert.ok(safetyCheck > 0);
  assert.ok(offerLookup > safetyCheck);
  assert.match(migration, /v_path = critical_route\.path/);
  assert.match(migration, /v_path like critical_route\.path \|\| '%'/);
});

test('commercial telemetry rejects ambiguous paths and keeps existing bounded controls', () => {
  assert.match(migration, /position\('\/\/' in v_path\) > 0/);
  assert.match(migration, /position\('\.\.' in v_path\) > 0/);
  assert.match(migration, /v_path ~ '\(\^\|\/\)\\\.\(\/\|\$\)'/);
  assert.match(migration, /v_event not in \('shown', 'clicked'\)/);
  assert.match(migration, /Opportunity not enabled for public commercial telemetry/);
  assert.match(migration, /p\.verification = 'verified'/);
  assert.match(migration, /p\.quality_status <> 'suspended'/);
});

test('migration fails closed and preserves the privileged-function guardrails', () => {
  assert.match(migration, /^begin;/);
  assert.match(migration, /to_regprocedure\('public\.record_commercial_event_v2\(text,text,uuid,text\)'\)/);
  assert.match(migration, /security definer/);
  assert.match(migration, /set search_path = public, pg_temp/);
  assert.match(migration, /commit;\s*$/);
});
