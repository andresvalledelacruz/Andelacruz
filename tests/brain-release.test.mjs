import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../supabase/functions/recommendation-runtime/index.ts', import.meta.url), 'utf8');
const manifest = JSON.parse(await readFile(new URL('../opportunity/brain-release.json', import.meta.url), 'utf8'));
const contract = await readFile(new URL('../opportunity/runtime-contract.mjs', import.meta.url), 'utf8');

const sha40 = /^[0-9a-f]{40}$/;

test('brain release pins an immutable 40-character Git commit', () => {
  assert.match(manifest.brainCommit, sha40);
  assert.equal(manifest.deploymentPolicy.pinImmutableCommit, true);
  assert.match(runtime, new RegExp(manifest.brainCommit));
  assert.match(runtime, new RegExp(`raw\\.githubusercontent\\.com/andresvalledelacruz/Andelacruz/${manifest.brainCommit}/opportunity/runtime-contract\\.mjs`));
});

test('runtime engine version matches manifest', () => {
  assert.match(runtime, new RegExp(`ENGINE_VERSION=${manifest.engineVersion}`));
});

test('runtime persists and returns the pinned brain commit', () => {
  assert.match(runtime, /brainCommit:BRAIN_COMMIT/);
  assert.match(contract, /brain_commit:brainCommit\?String\(brainCommit\):null/);
  assert.match(contract, /brainCommit,/);
});

test('release policy keeps safety and learning sample floors locked', () => {
  assert.equal(manifest.safetyPolicy.safetyOverrideFirst, true);
  assert.equal(manifest.safetyPolicy.commercialSuppressionOnSafety, true);
  assert.equal(manifest.safetyPolicy.learningMinimumSample, 10);
  assert.equal(manifest.safetyPolicy.learningMeasuredSample, 50);
});

test('runtime reads learning snapshots but tolerates snapshot read failure', () => {
  assert.match(runtime, /opportunity_learning_snapshots/);
  assert.match(runtime, /if\(!snapshotError\)/);
});
