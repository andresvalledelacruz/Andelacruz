import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSensitiveContentRelease, sensitiveContentFronts } from '../src/sensitive-content-release-gate.js';

const asOf = '2026-08-31';
const officialSource = { url: 'https://www.sanidad.gob.es/example', verified_at: '2026-08-31', official: true };

const approved = (roles) => Object.fromEntries(roles.map((role) => [role, {
  approved: true,
  credential_verified: true,
  reviewed_at: '2026-08-31'
}]));

test('catalog exposes cancer and accidental emergencies as governed fronts', () => {
  assert.deepEqual(sensitiveContentFronts(), ['cancer', 'accidental_emergencies']);
});

test('cancer draft is allowed but publication stays held without clinical and editorial approval', () => {
  const result = evaluateSensitiveContentRelease({
    front: 'cancer', mode: 'consultation-preparation', as_of: asOf, sources: [officialSource]
  });
  assert.equal(result.decision, 'HOLD_REVIEW_REQUIRED');
  assert.equal(result.draft_preparation_allowed, true);
  assert.equal(result.publication_allowed, false);
  assert.deepEqual(result.missing_reviews, ['clinical', 'editorial']);
  assert.equal(result.commercial_ui_allowed, false);
});

test('cancer work and admin content also requires legal approval', () => {
  const result = evaluateSensitiveContentRelease({
    front: 'cancer', mode: 'work-admin', as_of: asOf, sources: [officialSource],
    reviews: approved(['clinical', 'editorial'])
  });
  assert.deepEqual(result.missing_reviews, ['legal']);
  assert.equal(result.publication_allowed, false);
});

test('emergency content always enters Safety Gateway even with all reviews', () => {
  const result = evaluateSensitiveContentRelease({
    front: 'accidental-emergencies', mode: 'emergency', as_of: asOf, sources: [officialSource],
    reviews: approved(['emergency_clinical', 'safety', 'editorial'])
  });
  assert.equal(result.decision, 'SAFETY_GATEWAY');
  assert.equal(result.publication_allowed, false);
  assert.equal(result.requires_112_first, true);
  assert.equal(result.commercial_ui_allowed, false);
});

test('prevention can become implementation-ready only with current source and approvals', () => {
  const result = evaluateSensitiveContentRelease({
    front: 'accidental-emergencies', mode: 'prevention', as_of: asOf, sources: [officialSource],
    reviews: approved(['safety', 'editorial'])
  });
  assert.equal(result.decision, 'READY_FOR_IMPLEMENTATION');
  assert.equal(result.publication_allowed, true);
  assert.equal(result.commercial_ui_allowed, false);
});

test('stale and non-official sources fail closed', () => {
  const result = evaluateSensitiveContentRelease({
    front: 'cancer', mode: 'recent-diagnosis', as_of: asOf,
    sources: [{ url: 'https://example.test/blog', verified_at: '2025-01-01', official: false }],
    reviews: approved(['clinical', 'editorial'])
  });
  assert.equal(result.decision, 'HOLD_REVIEW_REQUIRED');
  assert.equal(result.publication_allowed, false);
  assert.ok(result.invalid_source_evidence.includes('current_official_source_required'));
});

test('unknown front and mode fail closed and stay auditable', () => {
  const result = evaluateSensitiveContentRelease({ front: 'cacer', mode: 'advice', as_of: asOf, sources: [officialSource] });
  assert.equal(result.publication_allowed, false);
  assert.equal(result.unknown_front, 'cacer');
  assert.equal(result.unknown_mode, 'advice');
});

