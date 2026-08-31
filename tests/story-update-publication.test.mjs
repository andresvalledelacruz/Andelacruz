import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildStoryUpdateDecisionTask,
  candidateStatusForDecision,
  safetyLevelBlocksAutomaticUpdatePublication
} from '../src/story-update-moderation.js';

const submission = {
  kind: 'story_update_submission',
  candidate_id: 41,
  story_id: 7,
  phase: 'mes_3',
  text: 'La situación ha cambiado desde que compartí mi historia.',
  story: 'La situación ha cambiado desde que compartí mi historia.',
  synthetic: true
};

test('approved story update creates only its dedicated publication task', () => {
  const task = buildStoryUpdateDecisionTask({
    auditEvent: { decision: 'approve', moderation_message_id: '99' },
    submission,
    decision: 'approve'
  });
  assert.equal(task.task, 'publish_story_update_candidate');
  assert.equal(task.story_update_submission.text, submission.text);
  assert.equal(Object.hasOwn(task.story_update_submission, 'story'), false);
  assert.equal(Object.hasOwn(task, 'story_submission'), false);
  assert.notEqual(task.task, 'publish_story_candidate');
});

test('escalated story update also strips moderation-only safety mirror', () => {
  const task = buildStoryUpdateDecisionTask({
    auditEvent: { decision: 'escalate', moderation_message_id: '100' },
    submission,
    decision: 'escalate'
  });
  assert.equal(task.task, 'human_safety_review');
  assert.equal(task.story_update_submission.text, submission.text);
  assert.equal(Object.hasOwn(task.story_update_submission, 'story'), false);
});

test('candidate decisions map to terminal moderation states', () => {
  assert.equal(candidateStatusForDecision('approve'), 'approved');
  assert.equal(candidateStatusForDecision('reject'), 'rejected');
  assert.equal(candidateStatusForDecision('escalate'), 'escalated');
  assert.throws(() => candidateStatusForDecision('unknown'), /invalid_story_update_decision/);
});

test('P0 and P1 updates can never proceed through automatic publication', () => {
  assert.equal(safetyLevelBlocksAutomaticUpdatePublication('P0'), true);
  assert.equal(safetyLevelBlocksAutomaticUpdatePublication('P1'), true);
  assert.equal(safetyLevelBlocksAutomaticUpdatePublication('P2'), false);
  assert.equal(safetyLevelBlocksAutomaticUpdatePublication('NONE'), false);
});

test('publication is append-only, idempotent and exposed only from published staging rows', () => {
  const publisher = fs.readFileSync(new URL('../src/publish-processor.js', import.meta.url), 'utf8');
  const opsApi = fs.readFileSync(new URL('../src/ops-api.js', import.meta.url), 'utf8');

  assert.match(publisher, /insert into staging_story_updates/i);
  assert.match(publisher, /on conflict \(candidate_id\) do nothing/i);
  assert.doesNotMatch(publisher, /update staging_story_updates\s+set/i);
  assert.match(publisher, /status = 'approved'/i);
  assert.match(opsApi, /from staging_story_updates/i);
  assert.match(opsApi, /status = 'published' and synthetic = true/i);
});

test('moderation decision synchronizes candidate before queueing publication', () => {
  const opsApi = fs.readFileSync(new URL('../src/ops-api.js', import.meta.url), 'utf8');
  assert.match(opsApi, /update staging_story_update_candidates/i);
  assert.match(opsApi, /status = 'pending_moderation'/i);
  assert.match(opsApi, /story_update_candidate_state_mismatch/);
});
