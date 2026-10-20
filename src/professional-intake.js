import { createHash, randomUUID } from 'node:crypto';
import { publicProfiles } from '../scripts/lib/professional-directory.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fields = Object.freeze({ name:100, profession:100, register:120, website:200,
  specialties:500, audience:200, description:700, area:150, modality:80,
  languages:180, pricing:180, email:150, phone:40 });
const optional = new Set(['register','phone']);
const exactKeys = (value, allowed) => value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).every(key => allowed.includes(key));
const reference = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:/-]{2,159}$/.test(value);
const error = (status, code) => Object.assign(new Error(code), { status, code });

export function professionalIntakeConfiguration(env = process.env) {
  const days = Number(env.PROFESSIONAL_INTAKE_RETENTION_DAYS);
  const ready = env.PROFESSIONAL_INTAKE_ENABLED === 'true' &&
    env.PROFESSIONAL_INTAKE_RETENTION_READY === 'true' && env.PROFESSIONAL_INTAKE_REVIEW_READY === 'true' &&
    reference(env.PROFESSIONAL_INTAKE_PRIVACY_REVIEW) && Number.isInteger(days) && days >= 1 && days <= 90;
  return Object.freeze({ enabled:Boolean(ready), retentionDays:ready ? days : null,
    privacyReference:ready ? env.PROFESSIONAL_INTAKE_PRIVACY_REVIEW : null });
}

export function validateProfessionalApplication(input) {
  const allowed = [...Object.keys(fields), 'request_id', 'privacy_acknowledged', 'truth_confirmed', 'commercial_opt_in'];
  if (!exactKeys(input, allowed) || !UUID.test(input.request_id ?? '') ||
      input.privacy_acknowledged !== true || input.truth_confirmed !== true ||
      typeof input.commercial_opt_in !== 'boolean') throw error(400, 'invalid_application');
  const payload = {};
  for (const [key, max] of Object.entries(fields)) {
    const value = input[key] ?? '';
    if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f<>]/.test(value) ||
        (!optional.has(key) && !value.trim())) throw error(400, 'invalid_application');
    payload[key] = value.trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) throw error(400, 'invalid_application');
  try {
    const url = new URL(payload.website);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error();
    payload.website = url.href;
  } catch { throw error(400, 'invalid_application'); }
  payload.commercial_opt_in = input.commercial_opt_in;
  return Object.freeze({ requestId:input.request_id.toLowerCase(), payload:Object.freeze(payload) });
}

// Intake is a separate, fixed professional surface. It never accepts a help query,
// story, tracking identifier, client conversion or a claimed public verification.
export async function receiveProfessionalApplication(pool, input, {
  configuration = professionalIntakeConfiguration(), synthetic = true, now = new Date()
} = {}) {
  if (!configuration.enabled || !pool) throw error(503, 'professional_intake_disabled');
  const application = validateProfessionalApplication(input);
  const payloadJson = JSON.stringify(application.payload);
  const digest = createHash('sha256').update(payloadJson).digest('hex');
  const expiresAt = new Date(now.getTime() + configuration.retentionDays * 86400000).toISOString();
  const client = await pool.connect();
  try {
    await client.query('begin');
    // Shared database budget, including all service instances. No IP, cookie or
    // persistent visitor identifier is collected for rate limiting.
    await client.query("select pg_advisory_xact_lock(hashtext('professional_intake_budget_v1'))");
    const prior = await client.query(`select receipt_id, payload_digest, expires_at from private.professional_applications
      where request_id = $1::uuid`, [application.requestId]);
    if (prior.rows[0]) {
      // The unique request ID remains reserved until retention cleanup removes
      // the row. Do not retry an insert or disclose the expired receipt.
      if (new Date(prior.rows[0].expires_at).getTime() <= now.getTime()) throw error(409, 'request_expired');
      if (prior.rows[0].payload_digest !== digest) throw error(409, 'request_conflict');
      await client.query('commit');
      return { receipt_id:prior.rows[0].receipt_id, status:'received_pending_review' };
    }
    const budget = await client.query(`select count(*)::int as received from private.professional_applications
      where received_at >= $1::timestamptz - interval '1 day'`, [now.toISOString()]);
    const received = budget.rows[0]?.received;
    if (!Number.isSafeInteger(received) || received < 0) throw error(503, 'professional_intake_unavailable');
    if (received >= 100) throw error(429, 'intake_capacity_reached');
    const receiptId = randomUUID();
    await client.query(`insert into private.professional_applications
      (receipt_id, request_id, payload_digest, payload, privacy_reference, received_at, expires_at, synthetic)
      values ($1::uuid,$2::uuid,$3,$4::jsonb,$5,$6::timestamptz,$7::timestamptz,$8)`,
      [receiptId, application.requestId, digest, payloadJson, configuration.privacyReference, now.toISOString(), expiresAt, synthetic !== false]);
    await client.query('commit');
    return { receipt_id:receiptId, status:'received_pending_review' };
  } catch (cause) {
    await client.query('rollback').catch(() => {});
    if (cause.status) throw cause;
    throw error(503, 'professional_intake_unavailable');
  } finally { client.release(); }
}

export function requireProfessionalReviewer(principal) {
  if (!principal || principal.transitional !== false || principal.role !== 'admin' ||
      principal.aal !== 'aal2' || !UUID.test(principal.subject ?? '')) throw error(403, 'individual_reviewer_required');
}

export async function listProfessionalApplications(pool, principal) {
  requireProfessionalReviewer(principal);
  if (!pool) throw error(503, 'professional_intake_unavailable');
  const { rows } = await pool.query(`select receipt_id, received_at, expires_at, status, synthetic, payload
    from private.professional_applications where expires_at > now() order by received_at asc limit 25`);
  return { applications:rows };
}

export async function reviewProfessionalApplication(pool, receiptId, input, principal, now = new Date()) {
  requireProfessionalReviewer(principal);
  if (!UUID.test(receiptId ?? '') || !exactKeys(input, ['decision','review','publication_authorization_reference']) ||
      !['approve_for_publication','reject','withdraw'].includes(input.decision)) throw error(400, 'invalid_review');
  if (!pool) throw error(503, 'professional_intake_unavailable');
  const client = await pool.connect();
  try {
    await client.query('begin');
    const { rows } = await client.query(`select receipt_id, status, payload, expires_at from private.professional_applications
      where receipt_id = $1::uuid and expires_at > $2::timestamptz for update`, [receiptId, now.toISOString()]);
    const row = rows[0];
    if (!row) throw error(404, 'application_not_found');
    if (row.status !== 'pending_review' && input.decision !== 'withdraw') throw error(409, 'application_already_reviewed');
    let profile = null;
    if (input.decision === 'approve_for_publication') {
      if (!reference(input.publication_authorization_reference) || !exactKeys(input.review,
        ['identity_verified','credentials_verified','terms_verified','reviewed_at','expires_at','sources'])) throw error(400, 'invalid_review');
      const p = row.payload;
      const candidate = { id:`professional-${receiptId}`, status:'published', publication_authorized:true,
        name:p.name, profession:p.profession, description:p.description, area:p.area, modality:p.modality,
        languages:p.languages, pricing:p.pricing, website:p.website,
        review:{ ...input.review, reviewer_reference:principal.subject } };
      if (!publicProfiles({version:1,profiles:[candidate]}, now)[0]) throw error(400, 'review_evidence_incomplete');
      profile = candidate;
    }
    const status = {approve_for_publication:'approved_for_publication',reject:'rejected',withdraw:'withdrawn'}[input.decision];
    await client.query(`update private.professional_applications set status=$2, public_profile=$3::jsonb
      where receipt_id=$1::uuid`, [receiptId,status,profile ? JSON.stringify(profile) : null]);
    await client.query(`insert into private.professional_review_events
      (receipt_id, actor_subject, decision, publication_authorization_reference, decided_at)
      values ($1::uuid,$2::uuid,$3,$4,$5::timestamptz)`,
      [receiptId,principal.subject,input.decision,input.decision === 'approve_for_publication' ? input.publication_authorization_reference : null,now.toISOString()]);
    await client.query('commit');
    // Approval prepares a public projection; a separate governed publication
    // must revalidate evidence/expiry. It never activates matching or billing.
    return {receipt_id:receiptId,status,published:false};
  } catch (cause) {
    await client.query('rollback').catch(() => {});
    if (cause.status) throw cause;
    throw error(503, 'professional_review_unavailable');
  } finally { client.release(); }
}
