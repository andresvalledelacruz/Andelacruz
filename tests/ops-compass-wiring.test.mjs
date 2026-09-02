import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/ops-api.js', import.meta.url), 'utf8');

test('Ops forwards Compass answers into the authoritative user-case engine', () => {
  assert.match(source, /compass_answers:\s*[\s\S]*payload\.compass_answers/);
  assert.match(source, /evaluateExecutiveDecision\(\{[\s\S]*kind:\s*'user_case'/);
});

test('Ops audit summary stores Compass outcome flags but not raw Compass answers', () => {
  assert.match(source, /compass:\s*compass[\s\S]*complete:[\s\S]*outcome:[\s\S]*human_review_recommended:[\s\S]*suppress_commercial_ui:/);

  const auditStart = source.indexOf('function executiveAuditSummary');
  const auditEnd = source.indexOf('async function ensureCommunitySchema');
  const auditSource = source.slice(auditStart, auditEnd);
  assert.doesNotMatch(auditSource, /compass_answers/);
});

test('Compass uncertainty is fail-closed in moderation decisions', () => {
  assert.match(source, /compassHumanReviewBlocked\s*=\s*[\s\S]*human_review_recommended\s*===\s*true/);
  assert.match(source, /if\s*\(compassHumanReviewBlocked\s*&&\s*decision\s*!==\s*'escalate'\)/);
  assert.match(source, /compass_human_review_requires_escalation/);
  assert.match(source, /required_decision:\s*'escalate'/);
});

test('existing Safety Gateway fail-closed rule remains present', () => {
  assert.match(source, /executiveResult\.decision\s*===\s*'SAFETY_GATEWAY'/);
  assert.match(source, /safety_gateway_requires_escalation/);
});
