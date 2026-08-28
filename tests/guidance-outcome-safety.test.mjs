import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const guidance = await readFile(new URL('../next-step-guidance.js', import.meta.url), 'utf8');
const edge = await readFile(new URL('../supabase/functions/recommendation-outcome/index.ts', import.meta.url), 'utf8');

test('emergency telephone links are never delayed for click tracking', () => {
  assert.match(guidance, /if\(!href\.startsWith\('tel:'\)\)/);
  assert.match(guidance, /if\(id==='112'\) return 'tel:112'/);
  assert.match(guidance, /if\(id==='024'\) return 'tel:024'/);
});

test('safety guidance does not render helpfulness experiment', () => {
  assert.match(guidance, /if\(!safety&&decisionId\)/);
});

test('public outcome endpoint rejects opportunity injection', () => {
  assert.match(edge, /eligible_opportunities/);
  assert.match(edge, /opportunity_not_eligible/);
});

test('public outcome endpoint blocks partner telemetry during safety override', () => {
  assert.match(edge, /decision\.safety_override&&recommendationKind==='partner'/);
  assert.match(edge, /commercial_outcome_blocked_by_safety/);
});

test('public outcome endpoint caps event volume per decision', () => {
  assert.match(edge, /\(count\|\|0\)>=20/);
  assert.match(edge, /decision_event_limit/);
});
