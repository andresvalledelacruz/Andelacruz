export const ALLOWED_EVENT_TYPES = Object.freeze(['detected','eligible','available','shown','clicked','consented','lead','converted']);

const FORBIDDEN_KEYS = new Set(['story','message','free_text','name','email','phone','dni','address','account','card','contract']);

export function createOpportunityEvent(input = {}) {
  if (!ALLOWED_EVENT_TYPES.includes(input.type)) throw new Error('Invalid event type');
  if (!input.opportunityId) throw new Error('Missing opportunityId');

  const metadata = { ...(input.metadata || {}) };
  for (const key of Object.keys(metadata)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) delete metadata[key];
  }

  return Object.freeze({
    type: input.type,
    opportunityId: input.opportunityId,
    partnerId: input.partnerId || null,
    pagePath: input.pagePath || null,
    territory: input.territory || null,
    sessionRef: input.sessionRef || null,
    value: Number.isFinite(input.value) ? input.value : null,
    currency: input.currency || null,
    metadata,
    createdAt: input.createdAt || new Date().toISOString()
  });
}
