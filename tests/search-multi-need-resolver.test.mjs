import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveMultipleNeeds, multipleNeedsCapabilities } from '../src/search-multi-need-resolver.js';

test('current self-harm crisis outranks debt and job loss', () => {
  const result = resolveMultipleNeeds('quiero morir y tengo deudas y me han despedido');
  assert.equal(result.matched, true);
  assert.equal(result.multiple_needs, true);
  assert.equal(result.primary_need.intent, 'active_self_harm');
  assert.equal(result.primary_need.safety_level, 'P0');
  assert.equal(result.suppress_commercial_ui, true);
  assert.equal(result.auto_navigate, false);
  assert.deepEqual(
    result.relevant_needs.map((need) => need.intent),
    ['active_self_harm', 'debt_overwhelm', 'job_loss']
  );
});

test('partner violence outranks a practical money need', () => {
  const result = resolveMultipleNeeds('mi pareja me maltrata y tengo deudas');
  assert.equal(result.primary_need.intent, 'intimate_partner_violence');
  assert.equal(result.primary_need.safety_level, 'P1');
  assert.equal(result.secondary_needs.some((need) => need.intent === 'debt_overwhelm'), true);
  assert.equal(result.suppress_commercial_ui, true);
});

test('clear needs preserve the existing Safety taxonomy before practical ordering', () => {
  const result = resolveMultipleNeeds('me han despedido y tengo deudas y no tengo con quien hablar');
  assert.equal(result.needs_clarification, false);
  assert.deepEqual(
    result.relevant_needs.map((need) => need.intent),
    ['debt_overwhelm', 'job_loss', 'loneliness']
  );
  assert.equal(result.primary_need.safety_level, 'P1');
  assert.equal(result.secondary_needs[0].safety_level, 'P2');
  assert.equal(result.suppress_commercial_ui, true);
});

test('negated current suicide language does not get hidden behind debt', () => {
  const result = resolveMultipleNeeds('no quiero morir pero tengo deudas');
  assert.equal(result.matched, true);
  assert.equal(result.primary_need.intent, 'debt_overwhelm');
  assert.equal(result.needs_clarification, true);
  assert.equal(result.unresolved_safety_contexts.includes('negated_current'), true);
  assert.equal(result.suppress_commercial_ui, true);
  assert.equal(result.auto_navigate, false);
});

test('informational suicide language keeps practical results relevant but unresolved', () => {
  const result = resolveMultipleNeeds('busco informacion sobre suicidio y necesito empleo');
  assert.equal(result.matched, true);
  assert.equal(result.relevant_needs.some((need) => need.intent === 'urgent_job_search'), true);
  assert.equal(result.needs_clarification, true);
  assert.equal(result.suppress_commercial_ui, true);
});

test('repeated expressions deduplicate the same route', () => {
  const result = resolveMultipleNeeds('tengo deudas y muchas deudas y no puedo pagar mis deudas');
  assert.equal(result.relevant_needs.filter((need) => need.intent === 'debt_overwhelm').length, 1);
});

test('unknown text remains clarification-first without inventing a route', () => {
  const result = resolveMultipleNeeds('zxqv asunto completamente distinto');
  assert.equal(result.matched, false);
  assert.equal(result.primary_need, null);
  assert.equal(result.needs_clarification, true);
  assert.equal(result.auto_navigate, false);
});

test('resolver output never retains the raw query', () => {
  const marker = 'ZXCV-PRIVATE-MARKER-983274';
  const result = resolveMultipleNeeds(marker);
  assert.equal(result.raw_query_retained, false);
  assert.equal(JSON.stringify(result).includes(marker), false);
});

test('capabilities pin bounded, non-navigating, safety-first behavior', () => {
  const caps = multipleNeedsCapabilities();
  assert.equal(caps.max_candidate_clauses, 12);
  assert.equal(caps.safety_first, true);
  assert.equal(caps.retains_raw_query, false);
  assert.equal(caps.auto_navigation, false);
  assert.equal(caps.commercial_ui_allowed_during_unresolved_safety, false);
});
