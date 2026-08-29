const candidateStatusByDecision = {
  approve: 'approved',
  reject: 'rejected',
  escalate: 'escalated'
};

export function isStoryUpdateSubmission(payload = {}) {
  return payload.kind === 'story_update_submission';
}

export function normalizeStoryUpdateCandidateId(payload = {}) {
  const candidateId = Number(payload.candidate_id);
  if (!Number.isSafeInteger(candidateId) || candidateId <= 0) {
    throw new Error('invalid_story_update_candidate_id');
  }
  return candidateId;
}

export function candidateStatusForDecision(decision) {
  const status = candidateStatusByDecision[decision];
  if (!status) throw new Error('invalid_story_update_decision');
  return status;
}

export function buildStoryUpdateDecisionTask({ auditEvent, submission, decision } = {}) {
  normalizeStoryUpdateCandidateId(submission);
  if (decision === 'approve') {
    return {
      ...auditEvent,
      task: 'publish_story_update_candidate',
      story_update_submission: submission
    };
  }
  if (decision === 'escalate') {
    return {
      ...auditEvent,
      task: 'human_safety_review',
      story_update_submission: submission
    };
  }
  if (decision === 'reject') return auditEvent;
  throw new Error('invalid_story_update_decision');
}

export function safetyLevelBlocksAutomaticUpdatePublication(level) {
  return level === 'P0' || level === 'P1';
}

