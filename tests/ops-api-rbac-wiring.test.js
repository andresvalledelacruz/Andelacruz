import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/ops-api.js', import.meta.url), 'utf8');

test('ops-api routes are wired through the RBAC authorization bridge', () => {
  assert.match(source, /buildOpsAuthorizationContext/);
  assert.match(source, /requireOpsCapability/);
  assert.doesNotMatch(source, /preHandler:\s*requireOps\b/);
});

test('moderation decisions re-authorize against the evaluated safety level', () => {
  assert.match(source, /authorizeOpsPrincipal/);
  assert.match(source, /safetyLevel:\s*executiveSummary\.safety_level/);
  assert.match(source, /individual_identity_required_for_safety/);
});

test('moderation audit actor comes from the authenticated principal', () => {
  assert.match(source, /request\.opsAuthorization\?\.principal\?\.subject/);
  assert.doesNotMatch(source, /actor:\s*'staging_ops_token'/);
});
