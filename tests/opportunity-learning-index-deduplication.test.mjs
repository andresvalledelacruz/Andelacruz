import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../supabase/migrations/20261111175237_remove_duplicate_opportunity_learning_index.sql', import.meta.url),
  'utf8'
);

test('the migration retains the used opportunity-learning index and removes only its verified duplicate', () => {
  assert.match(migration, /c\.relname = 'opportunity_learning_snapshots_latest_idx'/i);
  assert.match(migration, /c\.relname = 'opportunity_learning_snapshots_opportunity_created_idx'/i);
  assert.match(migration, /if v_keep\.indexrelid is null then\s+raise exception/i);
  assert.match(migration, /is distinct from row\s*\(/i);
  assert.match(migration, /pg_catalog\.pg_constraint[\s\S]+conindid = v_duplicate\.indexrelid/i);
  assert.match(
    migration,
    /drop index public\.opportunity_learning_snapshots_opportunity_created_idx/i
  );
  assert.doesNotMatch(migration, /drop index public\.opportunity_learning_snapshots_latest_idx/i);
});

test('the migration is data-preserving and safe when the legacy duplicate is already absent', () => {
  assert.match(migration, /set local lock_timeout = '5s'/i);
  assert.match(migration, /set local statement_timeout = '30s'/i);
  assert.match(migration, /if v_duplicate\.indexrelid is null then\s+return;/i);
  assert.doesNotMatch(migration, /\b(?:insert|update|delete|truncate)\b/i);
});
