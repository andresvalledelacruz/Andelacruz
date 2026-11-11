import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../supabase/migrations/20261111165800_index_application_foreign_keys.sql', import.meta.url),
  'utf8'
);
const processor = readFileSync(new URL('../src/publish-processor.js', import.meta.url), 'utf8');
const stagingSql = readFileSync(new URL('../sql/20260825_story_updates_staging.sql', import.meta.url), 'utf8');

const expectedIndexes = [
  ['private.safety_incidents', 'safety_incidents_assigned_to_idx', 'assigned_to'],
  ['public.commercial_conversion_receipts', 'commercial_conversion_receipts_offer_idx', 'offer_id'],
  ['public.partner_verification_events', 'partner_verification_events_partner_idx', 'partner_id'],
  ['public.staging_story_update_candidates', 'staging_story_update_candidates_story_idx', 'story_id, submitted_at desc'],
  ['public.staging_story_updates', 'staging_story_updates_story_published_idx', 'story_id, published_at asc']
];

test('the migration guards legacy tables and indexes every application foreign key reported by the advisor', () => {
  for (const [table, index, columns] of expectedIndexes) {
    assert.match(migration, new RegExp(`to_regclass\\('${table.replace('.', '\\.')}'\\)`, 'i'));
    assert.match(migration, new RegExp(`create index if not exists ${index}\\s+on ${table.replace('.', '\\.')} \\(${columns}\\)`, 'i'));
  }

  assert.doesNotMatch(migration, /\b(?:insert|update|delete|drop|truncate)\b/i);
});

test('the runtime bootstrap preserves story foreign-key indexes on existing and fresh staging tables', () => {
  assert.match(
    processor,
    /create index if not exists staging_story_update_candidates_story_idx\s+on staging_story_update_candidates \(story_id, submitted_at desc\)/i
  );
  assert.match(
    processor,
    /create index if not exists staging_story_updates_story_published_idx\s+on staging_story_updates \(story_id, published_at asc\)/i
  );
  assert.match(stagingSql, /staging_story_updates_story_published_idx/i);
});
