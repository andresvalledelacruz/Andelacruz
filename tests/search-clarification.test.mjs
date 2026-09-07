import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchClarification, searchClarificationCapabilities } from '../src/search-clarification.js';

test('unmatched ambiguous search gets fixed safety-first clarification choices', () => {
  const result = buildSearchClarification({
    matched: false,
    needs_clarification: true,
    raw_query_retained: false
  });

  assert.equal(result.needed, true);
  assert.equal(result.safety_first, true);
  assert.equal(result.suppress_commercial_ui, true);
  assert.equal(result.raw_query_required, false);
  assert.equal(result.retains_raw_query, false);
  assert.equal(result.diagnostic, false);
  assert.equal(result.automated_clinical_decision, false);
  assert.ok(result.options.length >= 6);
  assert.equal(result.options[0].id, 'safety_self');
  assert.equal(result.options[1].id, 'safety_other');
});

test('clarification choices cover practical and human domains without pretending to diagnose', () => {
  const result = buildSearchClarification({ matched: false, needs_clarification: true });
  const ids = result.options.map((option) => option.id);

  for (const id of ['loss_or_grief', 'violence_or_fear', 'money', 'work', 'loneliness_support', 'something_else']) {
    assert.ok(ids.includes(id), `missing clarification option: ${id}`);
  }

  assert.ok(result.options.every((option) => typeof option.label === 'string' && option.label.length > 0));
  assert.ok(result.options.every((option) => !('url' in option)), 'clarification must not silently route before the user chooses');
});

test('critical clarification options remain first and P0', () => {
  const result = buildSearchClarification({ matched: false, needs_clarification: true });
  const [self, other] = result.options;
  assert.equal(self.safety_level, 'P0');
  assert.equal(other.safety_level, 'P0');
  assert.ok(self.priority > result.options[2].priority);
  assert.ok(other.priority > result.options[2].priority);
});

test('already matched search does not receive a second competing decision layer', () => {
  const result = buildSearchClarification({
    matched: true,
    needs_clarification: false,
    suppress_commercial_ui: true
  });

  assert.equal(result.needed, false);
  assert.deepEqual(result.options, []);
  assert.equal(result.suppress_commercial_ui, true);
  assert.equal(result.raw_query_required, false);
});

test('non-clarification state stays inactive rather than guessing', () => {
  const result = buildSearchClarification({});
  assert.equal(result.needed, false);
  assert.deepEqual(result.options, []);
});

test('capabilities explicitly prohibit raw-query inference and retention', () => {
  const capabilities = searchClarificationCapabilities();
  assert.equal(capabilities.safety_first, true);
  assert.equal(capabilities.fixed_choices_only, true);
  assert.equal(capabilities.infers_from_raw_query, false);
  assert.equal(capabilities.retains_raw_query, false);
  assert.equal(capabilities.suppresses_commerce_while_unresolved, true);
});
