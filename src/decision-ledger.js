import crypto from 'node:crypto';

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function buildDecisionFingerprint(event = {}) {
  const safe = {
    version: Number(event.version || 1),
    event_type: String(event.event_type || ''),
    entity_type: String(event.entity_type || ''),
    entity_ref: event.entity_ref == null ? null : String(event.entity_ref),
    decision: String(event.decision || ''),
    reason_code: event.reason_code == null ? null : String(event.reason_code),
    score: Number.isFinite(Number(event.score)) ? Number(event.score) : null,
    safety_level: event.safety_level == null ? null : String(event.safety_level),
    actor_class: String(event.actor_class || 'staging_ops'),
    occurred_at: String(event.occurred_at || '')
  };
  return sha256(JSON.stringify(canonical(safe)));
}

export function sanitizeDecisionEvent(input = {}) {
  const eventType = String(input.event_type || '').trim();
  const entityType = String(input.entity_type || '').trim();
  const decision = String(input.decision || '').trim();
  if (!['moderation', 'product_evaluation', 'safety_review', 'system'].includes(eventType)) {
    throw new Error('invalid_event_type');
  }
  if (!['story', 'product_change', 'safety_case', 'system'].includes(entityType)) {
    throw new Error('invalid_entity_type');
  }
  if (!decision || decision.length > 64) throw new Error('invalid_decision');

  const occurredAt = input.occurred_at ? new Date(input.occurred_at) : new Date();
  if (Number.isNaN(occurredAt.getTime())) throw new Error('invalid_occurred_at');

  const event = {
    version: 1,
    event_type: eventType,
    entity_type: entityType,
    entity_ref: input.entity_ref == null ? null : String(input.entity_ref).slice(0, 120),
    decision,
    reason_code: input.reason_code == null ? null : String(input.reason_code).slice(0, 80),
    score: Number.isFinite(Number(input.score)) ? Math.max(0, Math.min(100, Number(input.score))) : null,
    safety_level: input.safety_level == null ? null : String(input.safety_level).slice(0, 16),
    actor_class: String(input.actor_class || 'staging_ops').slice(0, 64),
    occurred_at: occurredAt.toISOString(),
    metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {}
  };

  // Deliberadamente no admite texto libre de historias, alias, email, teléfono ni tokens.
  const forbiddenKeys = new Set(['story', 'text', 'body', 'alias', 'email', 'phone', 'token', 'secret', 'authorization']);
  event.metadata = Object.fromEntries(
    Object.entries(event.metadata)
      .filter(([key]) => !forbiddenKeys.has(String(key).toLowerCase()))
      .slice(0, 20)
      .map(([key, value]) => [String(key).slice(0, 80), typeof value === 'string' ? value.slice(0, 240) : value])
  );

  return { ...event, fingerprint: buildDecisionFingerprint(event) };
}

export async function ensureDecisionLedgerSchema(pool, environment = 'staging') {
  if (!pool || environment !== 'staging') return false;
  await pool.query(`
    create table if not exists staging_decision_ledger (
      id bigserial primary key,
      version integer not null default 1,
      event_type text not null,
      entity_type text not null,
      entity_ref text,
      decision text not null,
      reason_code text,
      score numeric,
      safety_level text,
      actor_class text not null,
      occurred_at timestamptz not null,
      metadata jsonb not null default '{}'::jsonb,
      fingerprint char(64) not null unique,
      recorded_at timestamptz not null default now()
    )
  `);
  await pool.query(`
    create index if not exists staging_decision_ledger_occurred_idx
      on staging_decision_ledger (occurred_at desc)
  `);
  await pool.query(`
    create index if not exists staging_decision_ledger_entity_idx
      on staging_decision_ledger (entity_type, entity_ref, occurred_at desc)
  `);
  return true;
}

export async function appendDecisionEvent(pool, input, environment = 'staging') {
  const event = sanitizeDecisionEvent(input);
  const ready = await ensureDecisionLedgerSchema(pool, environment);
  if (!ready) return { recorded: false, reason: 'ledger_not_available', event };

  const { rows } = await pool.query(
    `insert into staging_decision_ledger (
       version, event_type, entity_type, entity_ref, decision, reason_code, score,
       safety_level, actor_class, occurred_at, metadata, fingerprint
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12)
     on conflict (fingerprint) do nothing
     returning id`,
    [
      event.version,
      event.event_type,
      event.entity_type,
      event.entity_ref,
      event.decision,
      event.reason_code,
      event.score,
      event.safety_level,
      event.actor_class,
      event.occurred_at,
      JSON.stringify(event.metadata),
      event.fingerprint
    ]
  );
  return { recorded: Boolean(rows[0]?.id), id: rows[0]?.id ? String(rows[0].id) : null, event };
}

export async function recentDecisionEvents(pool, { limit = 50, entityType = '' } = {}, environment = 'staging') {
  const ready = await ensureDecisionLedgerSchema(pool, environment);
  if (!ready) return [];
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const values = [];
  let where = '';
  if (entityType) {
    values.push(String(entityType));
    where = `where entity_type = $${values.length}`;
  }
  values.push(safeLimit);
  const { rows } = await pool.query(
    `select id, event_type, entity_type, entity_ref, decision, reason_code, score,
            safety_level, actor_class, occurred_at, metadata, fingerprint
       from staging_decision_ledger
       ${where}
       order by occurred_at desc, id desc
       limit $${values.length}`,
    values
  );
  return rows.map((row) => ({ ...row, id: String(row.id) }));
}
