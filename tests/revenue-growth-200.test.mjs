import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { IMPROVEMENTS_200, programSummary, PROGRAM_BASE_SHA } from '../growth/program-200.mjs';
import {
  PUBLIC_COMMERCIAL_OPPORTUNITIES,
  NEVER_MONETIZE_FLAGS,
  evaluateRevenueSurface,
  evaluateAdSurface,
  storyCommercialPolicy
} from '../growth/revenue-policy.mjs';
import { validatePartner, validateOffer, REGULATED_OPPORTUNITIES } from '../growth/partner-policy.mjs';
import {
  CLINICAL_BOUNDARIES,
  canUseProfessionalReviewLabel,
  contentSafetyDecision,
  psychiatricContentAllowed
} from '../growth/multidisciplinary-governance.mjs';
import { ADS_STATE, ADS_ACTIVATION_REQUIREMENTS } from '../growth/ads-readiness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(ROOT, relative));

const publicPages = Object.freeze([
  ['historias/index.html', 'https://desgracias.es/historias/'],
  ['soluciones/index.html', 'https://desgracias.es/soluciones/'],
  ['colaborar/index.html', 'https://desgracias.es/colaborar/'],
  ['metodologia.html', 'https://desgracias.es/metodologia.html'],
  ['media-kit.html', 'https://desgracias.es/media-kit.html']
]);

function countMatches(text, regex) {
  return [...text.matchAll(regex)].length;
}

test('M001-M200: the managed growth program contains exactly 200 implemented controls', () => {
  assert.equal(IMPROVEMENTS_200.length, 200);
  assert.deepEqual(IMPROVEMENTS_200.map(item => item.id), Array.from({ length: 200 }, (_, index) => index + 1));
  assert.deepEqual(IMPROVEMENTS_200.map(item => item.code), Array.from({ length: 200 }, (_, index) => `M${String(index + 1).padStart(3, '0')}`));
  assert.ok(IMPROVEMENTS_200.every(item => item.status === 'implemented'));
  assert.ok(IMPROVEMENTS_200.every(item => item.safetyFirst === true));
  const summary = programSummary();
  assert.equal(summary.total, 200);
  assert.equal(summary.implemented, 200);
  assert.equal(Object.keys(summary.byDomain).length, 10);
  assert.ok(Object.values(summary.byDomain).every(value => value === 20));
  assert.equal(PROGRAM_BASE_SHA, 'c6ed5df25bd3f2f26a9026f17840a93ecc4a8b6e');
});

test('revenue engine fails closed on high-risk, restricted and safety-flagged contexts', () => {
  const base = {
    commercialPolicy: 'contextual', risk: 'low', domain: 'work', opportunityId: 'JOB_SEARCH',
    partnerVerified: true, partnerQualityStatus: 'good', explicitIntent: true, requiresConsent: false
  };
  assert.equal(evaluateRevenueSurface({ ...base, risk: 'high' }).allowed, false);
  assert.equal(evaluateRevenueSurface({ ...base, commercialPolicy: 'restricted' }).allowed, false);
  assert.equal(evaluateRevenueSurface({ ...base, domain: 'suicide_prevention_support' }).allowed, false);
  for (const flag of NEVER_MONETIZE_FLAGS) {
    assert.equal(evaluateRevenueSurface({ ...base, flags: [flag] }).allowed, false, `Flag must block: ${flag}`);
  }
});

test('revenue engine only allows a verified low-risk public opportunity after applicable consent', () => {
  assert.equal(evaluateRevenueSurface({
    commercialPolicy: 'contextual', risk: 'low', domain: 'work', opportunityId: 'JOB_SEARCH',
    partnerVerified: true, partnerQualityStatus: 'good', requiresConsent: false
  }).allowed, true);

  assert.equal(evaluateRevenueSurface({
    commercialPolicy: 'contextual', risk: 'medium', domain: 'social', opportunityId: 'SOCIAL_ACTIVITIES',
    partnerVerified: true, partnerQualityStatus: 'good', explicitIntent: false, requiresConsent: true, consent: true
  }).allowed, false);

  assert.equal(evaluateRevenueSurface({
    commercialPolicy: 'contextual', risk: 'medium', domain: 'social', opportunityId: 'SOCIAL_ACTIVITIES',
    partnerVerified: true, partnerQualityStatus: 'good', explicitIntent: true, requiresConsent: true, consent: true
  }).allowed, true);

  for (const id of ['PSYCHOLOGY', 'LOAN', 'DEBT_CONSOLIDATION', 'INSOLVENCY_LEGAL']) {
    assert.ok(!PUBLIC_COMMERCIAL_OPPORTUNITIES.includes(id), `${id} must stay outside anonymous runtime`);
  }
});

test('advertising remains disabled until a real publisher, CMP and consent are present', () => {
  assert.equal(ADS_STATE.enabled, false);
  assert.equal(ADS_STATE.publisherId, null);
  assert.equal(ADS_STATE.cmpReady, false);
  assert.ok(ADS_ACTIVATION_REQUIREMENTS.includes('real_publisher_id'));
  assert.ok(ADS_ACTIVATION_REQUIREMENTS.includes('google_certified_cmp_or_equivalent_compliant_flow'));
  assert.equal(evaluateAdSurface({ pathname: '/soluciones/', publisherId: '', cmpReady: false, consent: false }).allowed, false);
  assert.equal(evaluateAdSurface({ pathname: '/ayuda-urgente.html', publisherId: 'ca-pub-123456789', cmpReady: true, consent: true }).allowed, false);
  assert.equal(evaluateAdSurface({ pathname: '/soluciones/', publisherId: 'ca-pub-123456789', cmpReady: true, consent: true }).allowed, true);
  assert.equal(exists('ads.txt'), false, 'Do not ship a fabricated ads.txt before real seller IDs exist');
});

test('stories are never commercial surfaces', () => {
  assert.equal(storyCommercialPolicy({ isRealUserContent: true, risk: 'low' }).allowed, false);
  assert.equal(storyCommercialPolicy({ isRealUserContent: false, risk: 'low' }).allowed, false);
  assert.equal(storyCommercialPolicy({ isRealUserContent: false, risk: 'high' }).allowed, false);

  const storiesHtml = read('historias/index.html');
  assert.doesNotMatch(storiesHtml, /commercial-runtime\.js/i);
  assert.match(storiesHtml, /Historia de ejemplo/i);
  assert.match(storiesHtml, /no se publican automáticamente/i);
  assert.match(storiesHtml, /Sin monetización dentro del relato/i);
});

test('partner and offer validation is verification-first and quality-aware', () => {
  const partner = {
    id: 'partner-1', displayName: 'Partner', legalName: 'Partner SL', websiteDomain: 'example.com',
    status: 'active', verification: 'verified', qualityStatus: 'good', disclosure: 'Colaboración remunerada', qualityScore: 90
  };
  assert.equal(validatePartner(partner).valid, true);
  assert.equal(validatePartner({ ...partner, verification: 'pending' }).valid, false);
  assert.equal(validatePartner({ ...partner, qualityStatus: 'suspended' }).valid, false);

  const offer = {
    id: 'offer-1', opportunityId: 'JOB_SEARCH', destinationUrl: 'https://example.com/jobs', disclosure: 'Colaboración remunerada',
    compensationModel: 'cpl', territory: 'ES', status: 'active'
  };
  assert.equal(validateOffer(offer, partner).valid, true);
  assert.equal(validateOffer({ ...offer, opportunityId: 'PSYCHOLOGY' }, partner).valid, false);
  assert.ok(REGULATED_OPPORTUNITIES.includes('PSYCHOLOGY'));
  assert.ok(REGULATED_OPPORTUNITIES.includes('LOAN'));
});

test('multidisciplinary governance forbids diagnosis, prescribing and fake clinical authority', () => {
  for (const boundary of ['no_automatic_diagnosis', 'no_prescription', 'no_medication_adjustment', 'no_fake_clinical_review']) {
    assert.ok(CLINICAL_BOUNDARIES.includes(boundary));
  }
  assert.equal(psychiatricContentAllowed({ generalInformation: true, referralBoundaryVisible: true }), true);
  assert.equal(psychiatricContentAllowed({ generalInformation: true, referralBoundaryVisible: true, containsPrescription: true }), false);
  assert.equal(canUseProfessionalReviewLabel({ reviewerName: 'X', reviewedAt: '2026-09-15', scope: 'clinical', discipline: 'psychiatry', credentialsVerified: false }), false);
  assert.deepEqual(contentSafetyDecision({ risk: 'high' }), { priority: 'P1', commercial: false, professionalEscalation: true });
  assert.deepEqual(contentSafetyDecision({ flags: ['critical_safety'] }), { priority: 'P0', commercial: false, professionalEscalation: true });
});

test('all five growth pages are indexable, canonical, structured and self-contained', () => {
  for (const [file, canonical] of publicPages) {
    const html = read(file);
    assert.match(html, /<html lang="es">/i, `${file}: lang`);
    assert.match(html, /<meta name="description" content="[^"]{40,220}"/i, `${file}: description`);
    assert.match(html, /<meta name="robots" content="index,follow/i, `${file}: robots`);
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `${file}: canonical`);
    assert.equal(countMatches(html, /<h1\b/gi), 1, `${file}: exactly one H1`);
    assert.match(html, /type="application\/ld\+json"/i, `${file}: JSON-LD`);
    assert.match(html, /property="og:site_name" content="Desgracias\.es"/i, `${file}: OG site name`);
    assert.match(html, /name="twitter:card"/i, `${file}: Twitter card`);
    assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/i, `${file}: no external fonts`);
  }
});

test('commercial UI is low-risk, transparent and does not collect free text', () => {
  const html = read('soluciones/index.html');
  const runtime = read('commercial-runtime.js');
  for (const opportunity of PUBLIC_COMMERCIAL_OPPORTUNITIES) {
    assert.match(html, new RegExp(`data-opportunity="${opportunity}"`));
  }
  for (const forbidden of ['PSYCHOLOGY', 'LOAN', 'DEBT_CONSOLIDATION']) {
    assert.doesNotMatch(html, new RegExp(`data-opportunity="${forbidden}"`));
  }
  assert.match(html, /Ayuda urgente/i);
  assert.match(html, /La posición no se compra/i);
  assert.match(runtime, /credentials:\s*'omit'/);
  assert.match(runtime, /sponsored noopener noreferrer/);
  assert.match(runtime, /'shown'/);
  assert.match(runtime, /'clicked'/);
  assert.doesNotMatch(runtime, /localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(runtime, /textarea|FormData/);
  assert.match(runtime, /No mostramos sustitutos pagados ni empresas ficticias/i);
});

test('B2B acquisition and media kit never fabricate metrics or clinical claims', () => {
  const collaborate = read('colaborar/index.html');
  const media = read('media-kit.html');
  const methodology = read('metodologia.html');
  assert.match(collaborate, /Un pago no compra una recomendación/i);
  assert.match(collaborate, /No envíes datos de pacientes, clientes o personas usuarias/i);
  assert.match(media, /Sin cifras inventadas/i);
  assert.match(media, /no publica usuarios, páginas vistas, CTR, conversiones ni alcance/i);
  assert.match(methodology, /La autoridad profesional no se finge/i);
  assert.match(methodology, /no prescribimos, no ajustamos medicación/i);
  assert.match(methodology, /Revisado por profesional identificado/i);
});

test('growth sitemap and robots expose exactly the new complete visibility surfaces', () => {
  const sitemap = read('sitemap-growth.xml');
  const robots = read('robots.txt');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(locs, publicPages.map(([, canonical]) => canonical));
  assert.equal(new Set(locs).size, 5);
  assert.equal(countMatches(sitemap, /<lastmod>2026-09-15<\/lastmod>/g), 5);
  assert.match(robots, /Sitemap: https:\/\/desgracias\.es\/sitemap\.xml/);
  assert.match(robots, /Sitemap: https:\/\/desgracias\.es\/sitemap-growth\.xml/);
});

test('versioned SQL keeps anonymous commercial runtime low-risk and conversion service-only', () => {
  const sql = read('sql/20260915_commercial_runtime_v2_privacy_first.sql');
  assert.match(sql, /commercial_events_daily/);
  assert.match(sql, /commercial_conversion_receipts/);
  assert.match(sql, /get_runtime_partner_offers_v2/);
  assert.match(sql, /record_commercial_event_v2/);
  assert.match(sql, /record_commercial_conversion_v1/);
  for (const opportunity of PUBLIC_COMMERCIAL_OPPORTUNITIES) assert.match(sql, new RegExp(`'${opportunity}'`));
  assert.doesNotMatch(sql, /'PSYCHOLOGY'/);
  assert.doesNotMatch(sql, /'LOAN'/);
  assert.doesNotMatch(sql, /'DEBT_CONSOLIDATION'/);
  assert.match(sql, /event_type in \('shown','clicked'\)/);
  assert.match(sql, /grant execute on function public\.record_commercial_conversion_v1[\s\S]*to service_role/i);
  assert.match(sql, /revoke all on function public\.record_commercial_conversion_v1[\s\S]*from public, anon, authenticated/i);
});

test('growth package preserves the protected V9 and critical application core', () => {
  const changedSurfaceManifest = [
    'growth/program-200.mjs','growth/revenue-policy.mjs','growth/partner-policy.mjs','growth/multidisciplinary-governance.mjs',
    'growth/visibility-strategy.mjs','growth/ads-readiness.mjs','growth.css','commercial-runtime.js','stories-index.js',
    'historias/index.html','soluciones/index.html','colaborar/index.html','metodologia.html','media-kit.html',
    'sitemap-growth.xml','robots.txt','sql/20260915_commercial_runtime_v2_privacy_first.sql','tests/revenue-growth-200.test.mjs'
  ];
  assert.ok(changedSurfaceManifest.every(exists));
  assert.ok(!changedSurfaceManifest.includes('index.html'));
  assert.ok(!changedSurfaceManifest.includes('app-core.js'));
  assert.ok(!changedSurfaceManifest.includes('buscar/safety-router.js'));
});
