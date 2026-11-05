import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const bootstrap=readFileSync(new URL('../scripts/sql/professional-intake.sql',import.meta.url),'utf8');
const coreMigrationPath='../supabase/migrations/20261105140000_create_professional_intake_core.sql';
const receiptMigrationPath='../supabase/migrations/20261105150000_add_professional_retention_purge_receipts.sql';
const coreMigration=readFileSync(new URL(coreMigrationPath,import.meta.url),'utf8');
const receiptMigration=readFileSync(new URL(receiptMigrationPath,import.meta.url),'utf8');

function tableDefinition(sql,name) {
  const escaped=name.replaceAll('.','\\.');
  const match=sql.match(new RegExp(`create table(?: if not exists)? ${escaped}\\s*\\(([^;]+)\\);`,'s'));
  assert.ok(match,`${name} table definition is present`);
  return match[1].replace(/\s+/g,' ').trim();
}

test('managed migration order creates the professional core before purge receipts',()=>{
  assert.ok(coreMigrationPath < receiptMigrationPath);
  assert.match(coreMigration,/^begin;/);
  assert.match(coreMigration,/commit;\s*$/);
  assert.match(receiptMigration,/^begin;/);
  assert.match(receiptMigration,/commit;\s*$/);
});

test('core migration matches both bootstrap private tables',()=>{
  for (const name of ['private.professional_applications','private.professional_review_events']) {
    assert.equal(tableDefinition(coreMigration,name),tableDefinition(bootstrap,name),name);
  }
});

test('core migration fails closed on partial or pre-existing professional schemas',()=>{
  assert.match(coreMigration,/create schema if not exists private;/);
  for (const name of ['professional_applications','professional_review_events','professional_retention_purge_receipts']) {
    assert.match(coreMigration,new RegExp(`to_regclass\\('private\\.${name}'\\)`));
  }
  assert.match(coreMigration,/raise exception 'professional intake tables already exist;/);
  assert.doesNotMatch(coreMigration,/create table if not exists/i);
});

test('core migration keeps applications and review evidence private',()=>{
  for (const name of ['professional_applications','professional_review_events']) {
    assert.match(coreMigration,new RegExp(`alter table private\\.${name} enable row level security;`));
  }
  assert.match(coreMigration,/revoke all on private\.professional_applications, private\.professional_review_events from public, anon, authenticated;/);
  assert.match(coreMigration,/revoke all on sequence private\.professional_review_events_id_seq from public, anon, authenticated;/);
  assert.doesNotMatch(coreMigration,/grant\s+/i);
  assert.doesNotMatch(coreMigration,/create table private\.professional_retention_purge_receipts/i);
});

test('existing-database receipt migration matches the bootstrap receipt schema',()=>{
  assert.equal(tableDefinition(receiptMigration,'private.professional_retention_purge_receipts'),
    tableDefinition(bootstrap,'private.professional_retention_purge_receipts'));
});

test('receipt migration fails closed on an unexpected pre-existing table',()=>{
  assert.match(receiptMigration,/to_regclass\('private\.professional_retention_purge_receipts'\)/);
  assert.match(receiptMigration,/raise exception 'private\.professional_retention_purge_receipts already exists;/);
  assert.doesNotMatch(receiptMigration,/create table if not exists/i);
});

test('receipt migration is additive, private and aggregate-only',()=>{
  assert.match(receiptMigration,/alter table private\.professional_retention_purge_receipts enable row level security;/);
  assert.match(receiptMigration,/revoke all on private\.professional_retention_purge_receipts from public, anon, authenticated;/);
  assert.doesNotMatch(receiptMigration,/create table private\.professional_applications|create table private\.professional_review_events/i);
  assert.doesNotMatch(receiptMigration,/\b(receipt_id|request_id|application_id|email|phone|payload|public_profile)\b/i);
  const definition=tableDefinition(receiptMigration,'private.professional_retention_purge_receipts');
  const declaredColumns=[...definition.matchAll(
    /(?:^|,\s*)(plan_id|cutoff|batch_size|scope|eligible|synthetic|non_synthetic|completed_at)\s+/g)]
    .map(match=>match[1]);
  assert.deepEqual(declaredColumns,
    ['plan_id','cutoff','batch_size','scope','eligible','synthetic','non_synthetic','completed_at']);
});
