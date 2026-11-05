import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const bootstrap=readFileSync(new URL('../scripts/sql/professional-intake.sql',import.meta.url),'utf8');
const migration=readFileSync(new URL(
  '../supabase/migrations/20261105150000_add_professional_retention_purge_receipts.sql',import.meta.url),'utf8');

function receiptDefinition(sql) {
  const match=sql.match(/create table(?: if not exists)? private\.professional_retention_purge_receipts\s*\(([^;]+)\);/s);
  assert.ok(match,'receipt table definition is present');
  return match[1].replace(/\s+/g,' ').trim();
}

test('existing-database migration matches the bootstrap receipt schema',()=>{
  assert.equal(receiptDefinition(migration),receiptDefinition(bootstrap));
  assert.match(migration,/^begin;/);
  assert.match(migration,/commit;\s*$/);
});

test('receipt migration fails closed on an unexpected pre-existing table',()=>{
  assert.match(migration,/to_regclass\('private\.professional_retention_purge_receipts'\)/);
  assert.match(migration,/raise exception 'private\.professional_retention_purge_receipts already exists;/);
  assert.doesNotMatch(migration,/create table if not exists/i);
});

test('receipt migration is additive, private and aggregate-only',()=>{
  assert.match(migration,/alter table private\.professional_retention_purge_receipts enable row level security;/);
  assert.match(migration,/revoke all on private\.professional_retention_purge_receipts from public, anon, authenticated;/);
  assert.doesNotMatch(migration,/create table private\.professional_applications|create table private\.professional_review_events/i);
  assert.doesNotMatch(migration,/\b(receipt_id|request_id|application_id|email|phone|payload|public_profile)\b/i);
  const declaredColumns=[...receiptDefinition(migration).matchAll(
    /(?:^|,\s*)(plan_id|cutoff|batch_size|scope|eligible|synthetic|non_synthetic|completed_at)\s+/g)]
    .map(match=>match[1]);
  assert.deepEqual(declaredColumns,
    ['plan_id','cutoff','batch_size','scope','eligible','synthetic','non_synthetic','completed_at']);
});
