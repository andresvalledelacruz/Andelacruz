import { evaluateExecutiveDecision } from './executive-decision-engine.js';

const priorityByLevel = {
  P0: { rank: 400, label: 'EMERGENCIA', class_name: 'p0' },
  P1: { rank: 300, label: 'URGENTE', class_name: 'p1' },
  P2: { rank: 200, label: 'ATENCIÓN', class_name: 'p2' },
  NONE: { rank: 100, label: 'NORMAL', class_name: 'normal' }
};

function caseInput(payload = {}) {
  const isStoryUpdate = payload.kind === 'story_update_submission';
  return {
    kind: 'user_case',
    category: typeof payload.category === 'string' ? payload.category : '',
    title: typeof payload.title === 'string'
      ? payload.title
      : isStoryUpdate ? 'Actualización de una historia' : '',
    story: isStoryUpdate
      ? (typeof payload.text === 'string' ? payload.text : '')
      : (typeof payload.story === 'string' ? payload.story : ''),
    needs: Array.isArray(payload.needs) ? payload.needs : []
  };
}

export function buildModerationTriage(payload = {}) {
  const result = evaluateExecutiveDecision(caseInput(payload));
  const level = result.safety?.level || 'NONE';
  const priority = priorityByLevel[level] || priorityByLevel.NONE;
  const primary = result.multidisciplinary?.primary_need || {};

  return {
    version: 1,
    diagnostic: false,
    forensic_opinion: false,
    priority_rank: priority.rank,
    priority_label: priority.label,
    priority_class: priority.class_name,
    safety_level: level,
    safety_gateway: result.safety?.safety_gateway === true,
    human_review_required: result.safety?.human_review_required === true || result.multidisciplinary?.urgent_human_review === true,
    primary_need_id: primary.id || null,
    primary_need_label: primary.label || null,
    executive_decision: result.decision || 'ROUTE_WITH_GUARDRAILS',
    official_resources_spain: Array.isArray(result.safety?.official_resources_spain)
      ? result.safety.official_resources_spain
      : []
  };
}

export function sortModerationItems(items = []) {
  return [...items].sort((left, right) => {
    const leftRank = Number(left.triage?.priority_rank || 0);
    const rightRank = Number(right.triage?.priority_rank || 0);
    if (rightRank !== leftRank) return rightRank - leftRank;

    const leftTime = new Date(left.enqueued_at || 0).getTime();
    const rightTime = new Date(right.enqueued_at || 0).getTime();
    return leftTime - rightTime;
  });
}

export function moderationTriageSummary(items = []) {
  const summary = { P0: 0, P1: 0, P2: 0, NONE: 0 };
  for (const item of items) {
    const level = item.triage?.safety_level || 'NONE';
    if (Object.hasOwn(summary, level)) summary[level] += 1;
  }
  return {
    ...summary,
    safety_gateway: items.filter((item) => item.triage?.safety_gateway === true).length,
    total: items.length
  };
}
