import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSensitiveContentRelease, sensitiveContentFronts } from '../src/sensitive-content-release-gate.js';
import { sensitiveSourceRegistry } from '../src/sensitive-source-registry.js';

const asOf = '2026-08-31';
const cancerSource = 'sanidad_cancer_strategy';
const preventionSource = 'sanidad_aquatic_safety';

const approved = (roles) => Object.fromEntries(roles.map((role) => [role, {
  approved: true,
  credential_verified: true,
  reviewed_at: '2026-08-31'
}]));

test('catalog exposes cancer and accidental emergencies as governed fronts', () => {
  assert.deepEqual(sensitiveContentFronts(), ['cancer', 'accidental_emergencies']);
  assert.ok(sensitiveSourceRegistry().every(({ id, url, verified_at }) => id && url.startsWith('https://') && verified_at));
});

test('cancer draft is allowed but publication stays held without clinical and editorial approval', () => {
  const result = evaluateSensitiveContentRelease({
    front: 'cancer', mode: 'consultation-preparation', as_of: asOf, sources: [cancerSource]
  });
  assert.equal(result.decision, 'HOLD_REVIEW_REQUIRED');
  assert.equal(result.draft_preparation_allowed, true);
  assert.equal(result.publication_allowed, false);
  assert.deepEqual(result.missing_reviews, ['clinical', 'editorial']);
  assert.equal(result.commercial_ui_allowed, false);
});

test('cancer work and admin content also requires legal approval', () => {
  const result = evaluateSensitiveContentRelease({
    front: 'cancer', mode: 'work-admin', as_of: asOf, sources: [cancerSource, 'seguridad_social_temporary_disability'],
    reviews: approved(['clinical', 'editorial'])
  });
  assert.deepEqual(result.missing_reviews, ['legal']);
  assert.equal(result.publication_allowed, false);
});

test('emergency content always enters Safety Gateway even with all reviews', () => {
  const result = evaluateSensitiveContentRelease({
    front: 'accidental-emergencies', mode: 'emergency', as_of: asOf, sources: [preventionSource],
    reviews: approved(['emergency_clinical', 'safety', 'editorial'])
  });
  assert.equal(result.decision, 'SAFETY_GATEWAY');
  assert.equal(result.publication_allowed, false);
  assert.equal(result.requires_112_first, true);
  assert.equal(result.commercial_ui_allowed, false);
});

test('prevention can become implementation-ready only with current source and approvals', () => {
  const result = evaluateSensitiveContentRelease({
    front: 'accidental-emergencies', mode: 'prevention', as_of: asOf, sources: [preventionSource],
    reviews: approved(['safety', 'editorial'])
  });
  assert.equal(result.decision, 'READY_FOR_IMPLEMENTATION');
  assert.equal(result.publication_allowed, true);
  assert.equal(result.commercial_ui_allowed, false);
});

test('stale registered sources fail closed', () => {
  const result = evaluateSensitiveContentRelease({
    front: 'cancer', mode: 'recent-diagnosis', as_of: '2027-02-01', sources: [cancerSource],
    reviews: approved(['clinical', 'editorial'])
  });
  assert.equal(result.decision, 'HOLD_REVIEW_REQUIRED');
  assert.equal(result.publication_allowed, false);
  assert.ok(result.invalid_source_evidence.includes('current_official_source_required'));
});

test('unknown front and mode fail closed and stay auditable', () => {
  const result = evaluateSensitiveContentRelease({ front: 'cacer', mode: 'advice', as_of: asOf, sources: [cancerSource] });
  assert.equal(result.publication_allowed, false);
  assert.equal(result.unknown_front, 'cacer');
  assert.equal(result.unknown_mode, 'advice');
});

test('caller cannot self-declare an arbitrary URL as official', () => {
  const result = evaluateSensitiveContentRelease({
    front: 'cancer', mode: 'recent-diagnosis', as_of: asOf,
    sources: [{ url: 'https://example.test/fake', verified_at: asOf, official: true }],
    reviews: approved(['clinical', 'editorial'])
  });
  assert.equal(result.publication_allowed, false);
  assert.ok(result.invalid_source_evidence.includes('source_1_unregistered'));
});

test('registered source cannot be reused outside its governed front and mode', () => {
  const result = evaluateSensitiveContentRelease({
    front: 'cancer', mode: 'recent-diagnosis', as_of: asOf, sources: [preventionSource],
    reviews: approved(['clinical', 'editorial'])
  });
  assert.equal(result.publication_allowed, false);
  assert.ok(result.invalid_source_evidence.includes('source_1'));
});


