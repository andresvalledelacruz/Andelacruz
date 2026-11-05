import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { preparePublicProfile } from '../scripts/lib/professional-directory.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PUBLIC_PROFILE_ID = /^professional-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fields = Object.freeze({ name:100, profession:100, register_authority:180, register:120,
  register_url:240, insurance_evidence:300, website:200, specialties:500, audience:200,
  description:700, country:100, area:150, service_countries:240, modality:80,
  languages:180, pricing:180, email:150, phone:40 });
const optional = new Set(['register_authority','register','register_url','insurance_evidence','phone']);
const professionalCategories = ['employment','education'];
const exactKeys = (value, allowed) => value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).every(key => allowed.includes(key));
const validCategories = value => Array.isArray(value) && value.length > 0 &&
  value.length <= professionalCategories.length && value.length === new Set(value).size &&
  Array.from(value).every(category => professionalCategories.includes(category));
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

export function professionalRetentionPurgeConfiguration(env = process.env) {
  const batchSize = Number(env.PROFESSIONAL_INTAKE_PURGE_BATCH_SIZE ?? 250);
  const mode = env.PROFESSIONAL_INTAKE_PURGE_MODE;
  const confirmationSecret = env.PROFESSIONAL_INTAKE_PURGE_CONFIRMATION_SECRET;
  const planToken = env.PROFESSIONAL_INTAKE_PURGE_PLAN_TOKEN;
  const secretReady = typeof confirmationSecret === 'string' &&
    Buffer.byteLength(confirmationSecret) >= 32 && Buffer.byteLength(confirmationSecret) <= 256;
  const tokenReady = mode !== 'commit' || (typeof planToken === 'string' && planToken.length >= 80 && planToken.length <= 2048);
  const enabled = env.PROFESSIONAL_INTAKE_PURGE_ENABLED === 'true' &&
    ['plan','commit'].includes(mode) && Number.isInteger(batchSize) && batchSize >= 1 && batchSize <= 1000 &&
    secretReady && tokenReady;
  return Object.freeze({ enabled, mode:enabled ? mode : null, batchSize:enabled ? batchSize : null,
    confirmationSecret:enabled ? confirmationSecret : null,
    planToken:enabled && mode === 'commit' ? planToken : null });
}

const retentionStatuses = new Set(['pending_review','approved_for_publication','rejected','withdrawn']);
const retentionSummary = (rows, totalField, maxTotal) => {
  if (!Array.isArray(rows)) throw error(503, 'professional_retention_purge_unavailable');
  let total = 0;
  let synthetic = 0;
  for (const row of rows) {
    const count = Number(row.count);
    if (typeof row.synthetic !== 'boolean' || !retentionStatuses.has(row.status) ||
        !Number.isSafeInteger(count) || count < 0) {
      throw error(503, 'professional_retention_purge_unavailable');
    }
    total += count;
    if (row.synthetic) synthetic += count;
  }
  if (!Number.isSafeInteger(total) || !Number.isSafeInteger(synthetic) || total > maxTotal) {
    throw error(503, 'professional_retention_purge_unavailable');
  }
  return Object.freeze({ [totalField]:total, synthetic, non_synthetic:total - synthetic });
};

const confirmationWindowMs = 15 * 60 * 1000;
const confirmationPayload = (cutoff, batchSize, summary) => Object.freeze({
  version:1, cutoff, batch_size:batchSize, eligible:summary.eligible,
  synthetic:summary.synthetic, non_synthetic:summary.non_synthetic
});
const encodePurgeConfirmation = (payload, secret) => {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
};
const decodePurgeConfirmation = (token, secret, batchSize, now) => {
  if (typeof token !== 'string' || typeof secret !== 'string') {
    throw error(503, 'professional_retention_purge_confirmation_required');
  }
  const parts = token.split('.');
  if (parts.length !== 2 || !parts.every(part => /^[A-Za-z0-9_-]+$/.test(part))) {
    throw error(503, 'professional_retention_purge_confirmation_required');
  }
  const expected = createHmac('sha256', secret).update(parts[0]).digest();
  let received;
  let payload;
  try {
    received = Buffer.from(parts[1], 'base64url');
    payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  } catch {
    throw error(503, 'professional_retention_purge_confirmation_required');
  }
  if (received.length !== expected.length || !timingSafeEqual(received, expected) ||
      !exactKeys(payload, ['version','cutoff','batch_size','eligible','synthetic','non_synthetic']) ||
      payload.version !== 1 || payload.batch_size !== batchSize ||
      !Number.isSafeInteger(payload.eligible) || !Number.isSafeInteger(payload.synthetic) ||
      !Number.isSafeInteger(payload.non_synthetic) || payload.eligible < 0 || payload.synthetic < 0 ||
      payload.non_synthetic < 0 || payload.synthetic + payload.non_synthetic !== payload.eligible ||
      payload.eligible > batchSize) {
    throw error(503, 'professional_retention_purge_confirmation_required');
  }
  const cutoff = new Date(payload.cutoff);
  if (!Number.isFinite(cutoff.getTime()) || cutoff.toISOString() !== payload.cutoff ||
      cutoff.getTime() > now.getTime() || now.getTime() - cutoff.getTime() > confirmationWindowMs) {
    throw error(503, 'professional_retention_purge_confirmation_expired');
  }
  return Object.freeze(payload);
};

// Read-only, bounded planning. The result is only a momentary aggregate and is
// never evidence that deletion ran or that retention is operational.
export async function planExpiredProfessionalApplications(pool, {
  configuration = professionalRetentionPurgeConfiguration(), now = new Date()
} = {}) {
  if (!configuration?.enabled || configuration.mode !== 'plan' ||
      !Number.isInteger(configuration.batchSize) || configuration.batchSize < 1 ||
      configuration.batchSize > 1000 || typeof configuration.confirmationSecret !== 'string') {
    throw error(503, 'professional_retention_purge_plan_disabled');
  }
  if (!pool || !(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw error(503, 'professional_retention_purge_unavailable');
  }
  try {
    const result = await pool.query(`with expired as (
        select synthetic, status from private.professional_applications
        where expires_at <= $1::timestamptz
        order by expires_at asc, receipt_id asc
        limit $2
      )
      select synthetic, status, count(*)::int as count
      from expired group by synthetic, status`, [now.toISOString(), configuration.batchSize]);
    const summary = retentionSummary(result?.rows, 'eligible', configuration.batchSize);
    const payload = confirmationPayload(now.toISOString(), configuration.batchSize, summary);
    return Object.freeze({ ...summary,
      confirmation:encodePurgeConfirmation(payload, configuration.confirmationSecret) });
  } catch (cause) {
    if (cause.status) throw cause;
    throw error(503, 'professional_retention_purge_unavailable');
  }
}

// This prepares a bounded physical deletion, but deliberately does not schedule
// or activate it. A real retention claim still requires an independently
// configured runner and evidence that expired rows were actually purged.
export async function purgeExpiredProfessionalApplications(pool, {
  configuration = professionalRetentionPurgeConfiguration(), now = new Date()
} = {}) {
  if (!configuration?.enabled || configuration.mode !== 'commit' || !Number.isInteger(configuration.batchSize) ||
      configuration.batchSize < 1 || configuration.batchSize > 1000 ||
      typeof configuration.confirmationSecret !== 'string' || typeof configuration.planToken !== 'string') {
    throw error(503, 'professional_retention_purge_commit_required');
  }
  if (!pool || !(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw error(503, 'professional_retention_purge_unavailable');
  }
  const confirmation = decodePurgeConfirmation(configuration.planToken,
    configuration.confirmationSecret, configuration.batchSize, now);
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query("select pg_advisory_xact_lock(hashtext('professional_intake_retention_v1'))");
    const result = await client.query(`with expired as materialized (
        select receipt_id, synthetic, status from private.professional_applications
        where expires_at <= $1::timestamptz
        order by expires_at asc, receipt_id asc
        limit $2
        for update skip locked
      ), authorized as (
        select 1 from expired
        having count(*)::int = $3
          and count(*) filter (where synthetic)::int = $4
      )
      delete from private.professional_applications as application
      using expired, authorized
      where application.receipt_id = expired.receipt_id
      returning application.synthetic, application.status`, [confirmation.cutoff, configuration.batchSize,
      confirmation.eligible, confirmation.synthetic]);
    if (!Array.isArray(result?.rows)) throw error(503, 'professional_retention_purge_unavailable');
    const groups = new Map();
    for (const row of result.rows) {
      const key = `${row.synthetic}:${row.status}`;
      groups.set(key, { synthetic:row.synthetic, status:row.status, count:(groups.get(key)?.count || 0) + 1 });
    }
    const summary = retentionSummary([...groups.values()], 'deleted', configuration.batchSize);
    if (summary.deleted !== confirmation.eligible || summary.synthetic !== confirmation.synthetic ||
        summary.non_synthetic !== confirmation.non_synthetic) {
      throw error(409, 'professional_retention_purge_plan_changed');
    }
    await client.query('commit');
    return Object.freeze(summary);
  } catch (cause) {
    await client.query('rollback').catch(() => {});
    if (cause.status) throw cause;
    throw error(503, 'professional_retention_purge_unavailable');
  } finally { client.release(); }
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
  if (payload.register_url) {
    try {
      const url = new URL(payload.register_url);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
      payload.register_url = url.href;
    } catch { throw error(400, 'invalid_application'); }
  }
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

export async function previewProfessionalPublicProfile(pool, receiptId, principal, now = new Date()) {
  requireProfessionalReviewer(principal);
  if (!UUID.test(receiptId ?? '')) throw error(400, 'invalid_application_id');
  if (!pool) throw error(503, 'professional_intake_unavailable');
  try {
    const { rows } = await pool.query(`select status, public_profile from private.professional_applications
      where receipt_id = $1::uuid and expires_at > $2::timestamptz`, [receiptId, now.toISOString()]);
    const row = rows[0];
    if (!row) throw error(404, 'application_not_found');
    if (row.status !== 'approved_for_publication' || !row.public_profile) {
      throw error(409, 'professional_profile_not_approved');
    }
    const profile = preparePublicProfile(row.public_profile, now);
    if (!profile) throw error(409, 'professional_profile_not_publishable');
    // Return only the strict public projection. The receipt, contact details,
    // evidence URLs and internal review references have no response field.
    return { status:'approved_for_publication', published:false, profile };
  } catch (cause) {
    if (cause.status) throw cause;
    throw error(503, 'professional_profile_preview_unavailable');
  }
}

export async function reviewProfessionalApplication(pool, receiptId, input, principal, now = new Date()) {
  requireProfessionalReviewer(principal);
  if (!UUID.test(receiptId ?? '') || !exactKeys(input, ['decision','review','publication_authorization_reference','categories']) ||
      !['approve_for_publication','reject','withdraw'].includes(input.decision)) throw error(400, 'invalid_review');
  if (!pool) throw error(503, 'professional_intake_unavailable');
  const client = await pool.connect();
  try {
    await client.query('begin');
    const { rows } = await client.query(`select receipt_id, status, payload, public_profile, expires_at from private.professional_applications
      where receipt_id = $1::uuid and expires_at > $2::timestamptz for update`, [receiptId, now.toISOString()]);
    const row = rows[0];
    if (!row) throw error(404, 'application_not_found');
    const withdrawnPublicProfileId = input.decision === 'withdraw' &&
      PUBLIC_PROFILE_ID.test(row.public_profile?.id ?? '') ? row.public_profile.id : null;
    if (row.status === 'withdrawn' && input.decision === 'withdraw') {
      await client.query('commit');
      return {receipt_id:receiptId,status:'withdrawn',published:false,
        ...(withdrawnPublicProfileId ? {withdrawn_public_profile_id:withdrawnPublicProfileId} : {})};
    }
    const mayWithdrawApproved = input.decision === 'withdraw' && row.status === 'approved_for_publication';
    if (row.status !== 'pending_review' && !mayWithdrawApproved) throw error(409, 'application_already_reviewed');
    if (mayWithdrawApproved && !withdrawnPublicProfileId) throw error(409, 'approved_profile_reference_missing');
    let profile = null;
    if (input.decision === 'approve_for_publication') {
      if (!reference(input.publication_authorization_reference) || !validCategories(input.categories) || !exactKeys(input.review,
        ['identity_verified','credentials_verified','jurisdiction_verified','terms_verified','registration_status',
          'registration_review_reference','insurance_status','insurance_review_reference','reviewed_at','expires_at','sources']) ||
        !['verified','not_applicable'].includes(input.review.registration_status) ||
        !['verified','not_applicable'].includes(input.review.insurance_status) ||
        !reference(input.review.registration_review_reference) ||
        !reference(input.review.insurance_review_reference)) throw error(400, 'invalid_review');
      const p = row.payload;
      // The public identifier must not expose or be derivable from the private
      // receipt returned to the applicant. It is created once, inside the
      // approval transaction, and remains attached to the private candidate.
      const candidate = { id:`professional-${randomUUID()}`, status:'published', publication_authorized:true,
        publication_authorization_reference:input.publication_authorization_reference,
        commercial_relationship:'none',
        name:p.name, profession:p.profession, description:p.description, country:p.country, area:p.area,
        service_countries:p.service_countries, modality:p.modality, languages:p.languages,
        pricing:p.pricing, website:p.website, categories:[...input.categories],
        review:{ ...input.review, reviewer_reference:principal.subject } };
      if (!preparePublicProfile(candidate, now)) throw error(400, 'review_evidence_incomplete');
      profile = candidate;
    } else if (mayWithdrawApproved) {
      // Retain the private candidate until the configured retention deadline so
      // its opaque public ID remains available for a governed registry removal.
      // The withdrawn status prevents preview or republication.
      profile = row.public_profile;
    }
    const status = {approve_for_publication:'approved_for_publication',reject:'rejected',withdraw:'withdrawn'}[input.decision];
    await client.query(`update private.professional_applications set status=$2, public_profile=$3::jsonb
      where receipt_id=$1::uuid`, [receiptId,status,profile ? JSON.stringify(profile) : null]);
    await client.query(`insert into private.professional_review_events
      (receipt_id, actor_subject, decision, publication_authorization_reference, decided_at)
      values ($1::uuid,$2::uuid,$3,$4,$5::timestamptz)`,
      [receiptId,principal.subject,input.decision,input.decision === 'approve_for_publication' ? input.publication_authorization_reference : null,now.toISOString()]);
    await client.query('commit');
    // Approval prepares an explicitly unpaid public projection; a separate governed
    // publication must revalidate evidence/expiry. Applicant opt-in never activates
    // matching, billing or an undisclosed commercial relationship.
    return {receipt_id:receiptId,status,published:false,
      ...(withdrawnPublicProfileId ? {withdrawn_public_profile_id:withdrawnPublicProfileId} : {})};
  } catch (cause) {
    await client.query('rollback').catch(() => {});
    if (cause.status) throw cause;
    throw error(503, 'professional_review_unavailable');
  } finally { client.release(); }
}
