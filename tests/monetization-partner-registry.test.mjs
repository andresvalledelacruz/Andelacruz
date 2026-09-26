import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  validatePartnerRegistry,
  resolvePartner,
  partnerRegistryCapabilities
} from '../scripts/lib/monetization-partner-registry.mjs';

const registry = JSON.parse(await readFile(new URL('../data/monetization-partners.json', import.meta.url), 'utf8'));

test('partner registry starts valid, empty, deny-by-default and disabled', () => {
  const validation = validatePartnerRegistry(registry);
  assert.equal(validation.valid, true, validation.errors.join(', '));
  assert.equal(registry.default_status, 'denied');
  assert.equal(registry.activation_enabled, false);
  assert.equal(registry.partners.length, 0);
});

test('unknown partners are denied', () => {
  const result = resolvePartner(registry, 'unknown-provider');
  assert.equal(result.status, 'denied');
  assert.equal(result.approved, false);
  assert.equal(result.reason, 'not_registered');
});

test('candidate partner cannot be treated as approved', () => {
  const candidateRegistry = {
    version:1,
    default_status:'denied',
    activation_enabled:false,
    partners:[{ id:'training-provider', status:'candidate_review', approved:false }]
  };
  const validation = validatePartnerRegistry(candidateRegistry);
  assert.equal(validation.valid, true, validation.errors.join(', '));
  const result = resolvePartner(candidateRegistry, 'training-provider');
  assert.equal(result.approved, false);
  assert.equal(result.reason, 'not_approved');
});

test('approved partner requires complete due diligence and commercial disclosure fields', () => {
  const incomplete = {
    version:1,
    default_status:'denied',
    activation_enabled:false,
    partners:[{ id:'training-provider', status:'approved', approved:true }]
  };
  const validation = validatePartnerRegistry(incomplete);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes('legal_entity_name')));
  assert.ok(validation.errors.some((error) => error.includes('destination_domain')));
  assert.ok(validation.errors.some((error) => error.includes('due_diligence_complete')));
});

test('employment guarantees and paid editorial ranking invalidate an otherwise complete partner', () => {
  const invalid = {
    version:1,
    default_status:'denied',
    activation_enabled:false,
    partners:[{
      id:'training-provider',
      status:'approved', approved:true,
      legal_entity_name:'Provider Example SL',
      destination_domain:'provider.example',
      network_name:'Example Network',
      territories:['ES'],
      commission_model:'CPA disclosed before activation',
      disclosure_copy:'Enlace comercial claramente identificado.',
      refund_or_cancellation_reviewed:true,
      claims_reviewed:true,
      privacy_reviewed:true,
      due_diligence_complete:true,
      employment_guarantee_claim:true,
      paid_editorial_ranking:true
    }]
  };
  const validation = validatePartnerRegistry(invalid);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes('partner_0_employment_guarantee_forbidden'));
  assert.ok(validation.errors.includes('partner_0_paid_editorial_ranking_forbidden'));
});

test('registry cannot silently enable commercial activation', () => {
  const invalid = { version:1, default_status:'denied', activation_enabled:true, partners:[] };
  const validation = validatePartnerRegistry(invalid);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes('activation_must_remain_disabled'));
});

test('partner ids and domains are strictly bounded', () => {
  const invalid = {
    version:1, default_status:'denied', activation_enabled:false,
    partners:[{ id:'BAD ID', status:'candidate_review', approved:false }]
  };
  assert.equal(validatePartnerRegistry(invalid).valid, false);
  assert.equal(resolvePartner(registry, '../partner').reason, 'invalid_partner_id');
});

test('capabilities pin editorial independence and zero-side-effect behavior', () => {
  const caps = partnerRegistryCapabilities();
  assert.equal(caps.default_denied, true);
  assert.equal(caps.activation_side_effects, false);
  assert.equal(caps.unknown_partners_denied, true);
  assert.equal(caps.employment_guarantee_claims_forbidden, true);
  assert.equal(caps.paid_editorial_ranking_forbidden, true);
});
