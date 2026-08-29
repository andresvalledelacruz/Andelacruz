import Fastify from 'fastify';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { evaluateExecutiveDecision } from './executive-decision-engine.js';
import { buildModerationTriage, sortModerationItems, moderationTriageSummary } from './moderation-triage.js';
import {
  buildStoryUpdateDecisionTask,
  candidateStatusForDecision,
  isStoryUpdateSubmission,
  normalizeStoryUpdateCandidateId,
  safetyLevelBlocksAutomaticUpdatePublication
} from './story-update-moderation.js';

const { Pool } = pg;
const app = Fastify({ logger: true, bodyLimit: 16 * 1024 });

const port = Number(process.env.OPS_PORT || process.env.PORT || 10001);
const host = '0.0.0.0';
const environment = process.env.NODE_ENV || 'staging';
const opsToken = process.env.STAGING_OPS_TOKEN || '';
const queueNames = ['moderation', 'safety', 'internal_tasks'];
const here = dirname(fileURLToPath(import.meta.url));
const opsDir = resolve(here, '../ops');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

const allowedDecisions = new Set(['approve', 'reject', 'escalate']);
const allowedReasonCodes = new Set([
  'safe_and_useful',
  'needs_editing',
  'privacy_risk',
  'unsafe_guidance',
  'crisis_or_safeguarding',
  'spam_or_abuse',
  'out_of_scope',
  'duplicate_or_test'
]);
const reasonsByDecision = {
  approve: new Set(['safe_and_useful']),
  reject: new Set(['needs_editing', 'privacy_risk', 'unsafe_guidance', 'spam_or_abuse', 'out_of_scope', 'duplicate_or_test']),
  escalate: new Set(['crisis_or_safeguarding'])
};
const publicCommunityTypes = new Set(['tambien_me_paso', 'te_acompano', 'esto_me_ayudo']);
const publicInteractionWindowMs = 10 * 60 * 1000;
const publicInteractionMax = 60;
const publicInteractionsByIp = new Map();

function secureEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length || left.length === 0) return false;
  return crypto.timingSafeEqual(left, right);
}

async function requireOps(request, reply) {
  if (environment !== 'staging') return reply.code(404).send({ error: 'not_found' });
  if (!opsToken) return reply.code(503).send({ error: 'ops_not_configured' });

  const auth = String(request.headers.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!secureEqual(token, opsToken)) return reply.code(401).send({ error: 'unauthorized' });
}

function setSecurityHeaders(reply) {
  reply.header('Cache-Control', 'no-store');
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Robots-Tag', 'noindex, nofollow, noarchive');
  reply.header('Referrer-Policy', 'no-referrer');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('Cross-Origin-Opener-Policy', 'same-origin');
  reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
}

function isAllowedPublicOrigin(origin) {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return (
      url.hostname === 'desgracias-staging.pages.dev' ||
      url.hostname.endsWith('.desgracias-staging.pages.dev') ||
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1'
    );
  } catch {
    return false;
  }
}

function applyPublicCors(request, reply) {
  const origin = request.headers.origin;
  if (origin && isAllowedPublicOrigin(origin)) {
    reply.header('Access-Control-Allow-Origin', origin);
    reply.header('Vary', 'Origin');
  }
  reply.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');
  reply.header('Access-Control-Max-Age', '600');
}

function allowPublicOriginOrDeny(request, reply) {
  const origin = request.headers.origin;
  if (origin && !isAllowedPublicOrigin(origin)) {
    reply.code(403).send({ error: 'origin_not_allowed' });
    return false;
  }
  applyPublicCors(request, reply);
  return true;
}

function withinPublicInteractionRate(ip) {
  const now = Date.now();
  const recent = (publicInteractionsByIp.get(ip) || []).filter(
    (timestamp) => now - timestamp < publicInteractionWindowMs
  );
  if (recent.length >= publicInteractionMax) return false;
  recent.push(now);
  publicInteractionsByIp.set(ip, recent);
  return true;
}

function anonymousClientHash(clientId) {
  return crypto.createHash('sha256').update(`staging-community:${clientId}`).digest('hex');
}

function evaluateCase(payload = {}) {
  return evaluateExecutiveDecision({
    kind: 'user_case',
    category: typeof payload.category === 'string' ? payload.category : '',
    title: typeof payload.title === 'string' ? payload.title : '',
    story: typeof payload.story === 'string' ? payload.story : '',
    needs: Array.isArray(payload.needs) ? payload.needs : []
  });
}

function executiveAuditSummary(result = {}) {
  return {
    decision: result.decision || 'HUMAN_REVIEW',
    safety_level: result.safety?.level || 'NONE',
    safety_gateway: result.safety?.safety_gateway === true,
    official_resources_spain: Array.isArray(result.safety?.official_resources_spain)
      ? result.safety.official_resources_spain
      : [],
    primary_route: result.multidisciplinary?.primary_need?.id || null,
    next_step_class: result.multidisciplinary?.next_step_class || null,
    disciplines: Array.isArray(result.multidisciplinary?.disciplines)
      ? result.multidisciplinary.disciplines.slice(0, 12)
      : [],
    analytics_mode: result.analytics_mode || 'privacy_minimized',
    commercial_ui_allowed: result.commercial_ui_allowed !== false,
    diagnostic: false,
    forensic_opinion: false
  };
}

async function ensureCommunitySchema() {
  if (!pool || environment !== 'staging') return false;
  const existing = await pool.query(
    "select to_regclass('public.staging_published_stories') as table_name"
  );
  if (!existing.rows[0]?.table_name) return false;

  await pool.query(`
    create table if not exists staging_story_interactions (
      id bigserial primary key,
      story_id bigint not null references staging_published_stories(id) on delete cascade,
      interaction_type text not null check (
        interaction_type in ('tambien_me_paso','te_acompano','esto_me_ayudo')
      ),
      client_hash char(64) not null,
      active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (story_id, interaction_type, client_hash)
    )
  `);
  await pool.query(`
    create index if not exists staging_story_interactions_story_active_idx
      on staging_story_interactions (story_id, active)
  `);
  return true;
}

async function sendOpsAsset(reply, filename, contentType) {
  try {
    const content = await readFile(resolve(opsDir, filename));
    setSecurityHeaders(reply);
    reply.header('Content-Type', contentType);
    if (filename.endsWith('.html')) {
      reply.header(
        'Content-Security-Policy',
        "default-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'"
      );
    }
    return reply.send(content);
  } catch (error) {
    app.log.error({ err: error, filename }, 'ops asset unavailable');
    return reply.code(404).send('Not found');
  }
}

function excerptFromStory(story) {
  const text = String(story || '').replace(/\s+/g, ' ').trim();
  return text.length > 190 ? `${text.slice(0, 187).trim()}…` : text;
}

function publishedSummary(row) {
  const supportSignals = Number(row.support_signals || 0);
  const nobodyAloneEligible = row.nadie_solo_eligible === true;
  return {
    id: `published-${row.id}`,
    slug: row.slug,
    category: row.category,
    title: row.title,
    excerpt: excerptFromStory(row.story),
    phase: 'Recién publicada',
    context: 'Historia aprobada por moderación humana · staging',
    source: 'moderated_staging',
    published_at: row.published_at,
    nadie_solo_eligible: nobodyAloneEligible,
    nadie_solo_attention: nobodyAloneEligible && supportSignals === 0,
    community_supported: supportSignals > 0
  };
}

function publishedDetail(row, updates = []) {
  return {
    ...publishedSummary(row),
    body: [row.story],
    timeline: [
      {
        label: 'Publicada',
        text: 'Esta prueba pasó por revisión humana antes de incorporarse al entorno de staging.'
      },
      ...updates.map((update) => ({
        label: update.phase,
        text: update.update_text,
        published_at: update.published_at
      }))
    ],
    helped: [],
    nextSteps: [],
    needs: Array.isArray(row.needs) ? row.needs : []
  };
}

app.addHook('onSend', async (_request, reply, payload) => {
  setSecurityHeaders(reply);
  return payload;
});

app.get('/', async (_request, reply) => reply.redirect('/ops'));
app.get('/ops', async (_request, reply) => sendOpsAsset(reply, 'index.html', 'text/html; charset=utf-8'));
app.get('/ops/', async (_request, reply) => sendOpsAsset(reply, 'index.html', 'text/html; charset=utf-8'));
app.get('/ops/ops.css', async (_request, reply) => sendOpsAsset(reply, 'ops.css', 'text/css; charset=utf-8'));
app.get('/ops/ops.js', async (_request, reply) => sendOpsAsset(reply, 'ops.js', 'text/javascript; charset=utf-8'));

app.get('/health', async () => ({
  status: 'ok',
  service: 'desgracias-ops-api',
  environment,
  timestamp: new Date().toISOString()
}));

app.get('/ready', async (_request, reply) => {
  if (!pool) return reply.code(503).send({ status: 'not_ready', database: 'not_configured' });
  if (!opsToken) return reply.code(503).send({ status: 'not_ready', ops_auth: 'not_configured' });
  try {
    await pool.query('select 1');
    return { status: 'ready', database: 'ok', ops_auth: 'configured' };
  } catch (error) {
    app.log.error(error);
    return reply.code(503).send({ status: 'not_ready', database: 'error' });
  }
});

app.options('/public/stories', async (request, reply) => {
  if (!allowPublicOriginOrDeny(request, reply)) return;
  return reply.code(204).send();
});

app.options('/public/stories/:slug', async (request, reply) => {
  if (!allowPublicOriginOrDeny(request, reply)) return;
  return reply.code(204).send();
});

app.options('/public/stories/:slug/interactions', async (request, reply) => {
  if (!allowPublicOriginOrDeny(request, reply)) return;
  return reply.code(204).send();
});

app.options('/public/nadie-solo', async (request, reply) => {
  if (!allowPublicOriginOrDeny(request, reply)) return;
  return reply.code(204).send();
});

app.get('/public/stories', async (request, reply) => {
  if (!allowPublicOriginOrDeny(request, reply)) return;
  if (environment !== 'staging') return reply.code(404).send({ error: 'not_found' });
  if (!pool) return reply.code(503).send({ error: 'database_not_configured' });

  const category = typeof request.query?.category === 'string' ? request.query.category.trim() : '';
  try {
    await ensureCommunitySchema();
    const values = [];
    let where = "where s.status = 'published' and s.synthetic = true";
    if (category) {
      values.push(category);
      where += ` and s.category = $${values.length}`;
    }
    const { rows } = await pool.query(
      `select s.id, s.slug, s.category, s.title, s.story, s.needs, s.published_at,
              s.nadie_solo_eligible,
              coalesce((
                select count(*)
                from staging_story_interactions i
                where i.story_id = s.id and i.active = true
              ), 0)::int as support_signals
       from staging_published_stories s
       ${where}
       order by
         (s.nadie_solo_eligible and not exists (
           select 1 from staging_story_interactions i
           where i.story_id = s.id and i.active = true
         )) desc,
         s.published_at desc
       limit 50`,
      values
    );
    return {
      environment,
      synthetic: true,
      source: 'human_moderated_staging',
      disclaimer: 'Contenido ficticio aprobado por moderación humana en staging.',
      items: rows.map(publishedSummary)
    };
  } catch (error) {
    if (error?.code === '42P01') {
      return { environment, synthetic: true, source: 'human_moderated_staging', items: [] };
    }
    app.log.error({ err: error }, 'published staging stories unavailable');
    return reply.code(503).send({ error: 'published_stories_unavailable' });
  }
});

app.get('/public/stories/:slug', async (request, reply) => {
  if (!allowPublicOriginOrDeny(request, reply)) return;
  if (environment !== 'staging') return reply.code(404).send({ error: 'not_found' });
  if (!pool) return reply.code(503).send({ error: 'database_not_configured' });

  const slug = String(request.params?.slug || '').trim();
  try {
    await ensureCommunitySchema();
    const { rows } = await pool.query(
      `select s.id, s.slug, s.category, s.title, s.story, s.needs, s.published_at,
              s.nadie_solo_eligible,
              coalesce((
                select count(*)
                from staging_story_interactions i
                where i.story_id = s.id and i.active = true
              ), 0)::int as support_signals
       from staging_published_stories s
       where s.slug = $1 and s.status = 'published' and s.synthetic = true
       limit 1`,
      [slug]
    );
    if (!rows[0]) return reply.code(404).send({ error: 'story_not_found' });
    const updatesResult = await pool.query(
      `select phase, update_text, published_at
       from staging_story_updates
       where story_id = $1 and status = 'published' and synthetic = true
       order by published_at asc, id asc`,
      [rows[0].id]
    );
    return {
      environment,
      synthetic: true,
      source: 'human_moderated_staging',
      disclaimer: 'Historia ficticia aprobada por moderación humana en staging.',
      story: publishedDetail(rows[0], updatesResult.rows)
    };
  } catch (error) {
    app.log.error({ err: error, slug }, 'published staging story unavailable');
    return reply.code(503).send({ error: 'published_story_unavailable' });
  }
});

app.post('/public/stories/:slug/interactions', async (request, reply) => {
  if (!allowPublicOriginOrDeny(request, reply)) return;
  if (environment !== 'staging') return reply.code(404).send({ error: 'not_found' });
  if (!pool) return reply.code(503).send({ error: 'database_not_configured' });

  const slug = String(request.params?.slug || '').trim();
  const body = request.body ?? {};
  const type = typeof body.type === 'string' ? body.type.trim() : '';
  const clientId = typeof body.client_id === 'string' ? body.client_id.trim() : '';
  const active = body.active !== false;
  const synthetic = body.synthetic === true;

  if (!publicCommunityTypes.has(type)) return reply.code(400).send({ error: 'invalid_interaction' });
  if (!synthetic) return reply.code(400).send({ error: 'staging_requires_synthetic_content' });
  if (!/^[A-Za-z0-9-]{16,80}$/.test(clientId)) {
    return reply.code(400).send({ error: 'invalid_client_id' });
  }

  const ip = request.ip || 'unknown';
  if (!withinPublicInteractionRate(ip)) {
    return reply.code(429).send({ error: 'rate_limit', retry_after_seconds: 600 });
  }

  try {
    const schemaReady = await ensureCommunitySchema();
    if (!schemaReady) return reply.code(503).send({ error: 'community_not_ready' });

    const storyResult = await pool.query(
      `select id, nadie_solo_eligible
       from staging_published_stories
       where slug = $1 and status = 'published' and synthetic = true
       limit 1`,
      [slug]
    );
    const story = storyResult.rows[0];
    if (!story) return reply.code(404).send({ error: 'story_not_found' });

    const clientHash = anonymousClientHash(clientId);
    await pool.query(
      `insert into staging_story_interactions (
         story_id, interaction_type, client_hash, active, created_at, updated_at
       ) values ($1,$2,$3,$4,now(),now())
       on conflict (story_id, interaction_type, client_hash)
       do update set active = excluded.active, updated_at = now()`,
      [story.id, type, clientHash, active]
    );

    const signalsResult = await pool.query(
      `select count(*)::int as support_signals
       from staging_story_interactions
       where story_id = $1 and active = true`,
      [story.id]
    );
    const supportSignals = Number(signalsResult.rows[0]?.support_signals || 0);
    const nobodyAloneAttention = story.nadie_solo_eligible === true && supportSignals === 0;

    app.log.info(
      { slug, type, active, nadieSoloAttention: nobodyAloneAttention },
      'staging community signal updated'
    );

    return reply.code(202).send({
      status: active ? 'interaction_recorded' : 'interaction_removed',
      active,
      synthetic: true,
      nadie_solo_attention: nobodyAloneAttention
    });
  } catch (error) {
    app.log.error({ err: error, slug, type }, 'staging community interaction failed');
    return reply.code(503).send({ error: 'community_interaction_unavailable' });
  }
});

app.get('/public/nadie-solo', async (request, reply) => {
  if (!allowPublicOriginOrDeny(request, reply)) return;
  if (environment !== 'staging') return reply.code(404).send({ error: 'not_found' });
  if (!pool) return reply.code(503).send({ error: 'database_not_configured' });

  try {
    const schemaReady = await ensureCommunitySchema();
    if (!schemaReady) {
      return { environment, synthetic: true, principle: 'first_support_not_popularity', items: [] };
    }
    const { rows } = await pool.query(
      `select s.id, s.slug, s.category, s.title, s.story, s.needs, s.published_at,
              s.nadie_solo_eligible, 0::int as support_signals
       from staging_published_stories s
       where s.status = 'published'
         and s.synthetic = true
         and s.nadie_solo_eligible = true
         and not exists (
           select 1
           from staging_story_interactions i
           where i.story_id = s.id and i.active = true
         )
       order by s.published_at asc
       limit 12`
    );
    return {
      environment,
      synthetic: true,
      principle: 'first_support_not_popularity',
      disclaimer: 'Nadie Solo prioriza historias sin una primera señal comunitaria; no crea rankings de sufrimiento.',
      items: rows.map(publishedSummary)
    };
  } catch (error) {
    app.log.error({ err: error }, 'nadie solo staging feed unavailable');
    return reply.code(503).send({ error: 'nadie_solo_unavailable' });
  }
});

app.get('/ops/summary', { preHandler: requireOps }, async (_request, reply) => {
  if (!pool) return reply.code(503).send({ error: 'database_not_configured' });
  try {
    const queues = {};
    for (const queue of queueNames) {
      const { rows } = await pool.query('select * from pgmq.metrics($1)', [queue]);
      queues[queue] = rows[0] ?? {};
    }
    return { environment, service: 'desgracias-ops-api', queues };
  } catch (error) {
    app.log.error({ err: error }, 'ops summary failed');
    return reply.code(503).send({ error: 'queue_metrics_unavailable' });
  }
});

app.get('/ops/moderation/pending', { preHandler: requireOps }, async (request, reply) => {
  if (!pool) return reply.code(503).send({ error: 'database_not_configured' });
  const requestedLimit = Number(request.query?.limit || 10);
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 25) : 10;

  try {
    const { rows } = await pool.query(
      `select msg_id, read_ct, enqueued_at, vt, message
       from pgmq.q_moderation
       where vt <= now()
       order by msg_id asc
       limit $1`,
      [limit]
    );

    const items = sortModerationItems(rows.map((row) => ({
      message_id: String(row.msg_id),
      read_count: Number(row.read_ct || 0),
      enqueued_at: row.enqueued_at,
      visible_at: row.vt,
      payload: row.message,
      triage: buildModerationTriage(row.message || {})
    })));

    return {
      environment,
      queue: 'moderation',
      count: items.length,
      triage_summary: moderationTriageSummary(items),
      ordering: 'safety_priority_then_oldest',
      items
    };
  } catch (error) {
    app.log.error({ err: error }, 'moderation queue read failed');
    return reply.code(503).send({ error: 'moderation_queue_unavailable' });
  }
});

app.get('/ops/moderation/:messageId/brief', { preHandler: requireOps }, async (request, reply) => {
  if (!pool) return reply.code(503).send({ error: 'database_not_configured' });
  const messageId = String(request.params?.messageId || '').trim();
  if (!/^\d+$/.test(messageId)) return reply.code(400).send({ error: 'invalid_message_id' });

  try {
    const { rows } = await pool.query(
      `select msg_id, message
       from pgmq.q_moderation
       where msg_id = $1::bigint
       limit 1`,
      [messageId]
    );
    const item = rows[0];
    if (!item) return reply.code(404).send({ error: 'moderation_item_not_found' });

    const result = evaluateCase(item.message || {});
    return {
      environment,
      message_id: messageId,
      engine: 'executive-decision-engine',
      authoritative: true,
      result
    };
  } catch (error) {
    app.log.error({ err: error, messageId }, 'executive moderation brief failed');
    return reply.code(503).send({ error: 'executive_brief_unavailable' });
  }
});

app.post('/ops/moderation/:messageId/decision', { preHandler: requireOps }, async (request, reply) => {
  if (!pool) return reply.code(503).send({ error: 'database_not_configured' });

  const messageId = String(request.params?.messageId || '').trim();
  if (!/^\d+$/.test(messageId)) return reply.code(400).send({ error: 'invalid_message_id' });

  const body = request.body ?? {};
  const decision = typeof body.decision === 'string' ? body.decision.trim() : '';
  const reasonCode = typeof body.reason_code === 'string' ? body.reason_code.trim() : '';
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : '';

  if (!allowedDecisions.has(decision)) return reply.code(400).send({ error: 'invalid_decision' });
  if (!allowedReasonCodes.has(reasonCode)) return reply.code(400).send({ error: 'invalid_reason_code' });
  if (!reasonsByDecision[decision]?.has(reasonCode)) {
    return reply.code(400).send({ error: 'invalid_reason_for_decision' });
  }

  const client = await pool.connect();
  try {
    await client.query('begin');
    const { rows } = await client.query(
      `select msg_id, message
       from pgmq.q_moderation
       where msg_id = $1::bigint
       for update`,
      [messageId]
    );

    const item = rows[0];
    if (!item) {
      await client.query('rollback');
      return reply.code(404).send({ error: 'moderation_item_not_found' });
    }

    const original = item.message || {};
    const executiveResult = evaluateCase(original);
    const executiveSummary = executiveAuditSummary(executiveResult);

    const isStoryUpdate = isStoryUpdateSubmission(original);
    const updateSafetyBlocked = isStoryUpdate &&
      safetyLevelBlocksAutomaticUpdatePublication(executiveSummary.safety_level);
    if ((executiveResult.decision === 'SAFETY_GATEWAY' || updateSafetyBlocked) && decision !== 'escalate') {
      await client.query('rollback');
      return reply.code(409).send({
        error: 'safety_gateway_requires_escalation',
        required_decision: 'escalate',
        executive_brief: executiveSummary
      });
    }

    if (decision === 'approve' && reasonCode !== 'safe_and_useful') {
      await client.query('rollback');
      return reply.code(400).send({ error: 'approval_requires_safe_and_useful' });
    }

    const decidedAt = new Date().toISOString();
    const auditEvent = {
      kind: 'moderation_decision',
      version: 2,
      environment,
      source: 'ops_staging',
      actor: 'staging_ops_token',
      moderation_message_id: String(item.msg_id),
      decision,
      reason_code: reasonCode,
      note: note || null,
      decided_at: decidedAt,
      synthetic: original.synthetic === true,
      executive_brief: executiveSummary
    };

    if (isStoryUpdate) {
      const candidateId = normalizeStoryUpdateCandidateId(original);
      const candidateStatus = candidateStatusForDecision(decision);
      const candidateResult = await client.query(
        `update staging_story_update_candidates
            set status = $1, decided_at = $2, decision_reason = $3
          where id = $4
            and moderation_message_id = $5::bigint
            and status = 'pending_moderation'
        returning id`,
        [candidateStatus, decidedAt, reasonCode, candidateId, messageId]
      );
      if (!candidateResult.rows[0]) throw new Error('story_update_candidate_state_mismatch');
    }

    if (decision === 'approve') {
      const task = isStoryUpdate
        ? buildStoryUpdateDecisionTask({ auditEvent, submission: original, decision })
        : { ...auditEvent, task: 'publish_story_candidate', story_submission: original };
      await client.query(
        'select pgmq.send($1, $2::jsonb)',
        ['internal_tasks', JSON.stringify(task)]
      );
    } else if (decision === 'escalate') {
      const task = isStoryUpdate
        ? buildStoryUpdateDecisionTask({ auditEvent, submission: original, decision })
        : { ...auditEvent, task: 'human_safety_review', story_submission: original };
      await client.query(
        'select pgmq.send($1, $2::jsonb)',
        ['safety', JSON.stringify(task)]
      );
    } else {
      await client.query(
        'select pgmq.send($1, $2::jsonb)',
        ['internal_tasks', JSON.stringify(auditEvent)]
      );
    }

    const archived = await client.query(
      'select pgmq.archive($1, $2::bigint) as archived',
      ['moderation', messageId]
    );
    if (archived.rows[0]?.archived !== true) throw new Error('archive_failed');

    await client.query('commit');
    app.log.info(
      { messageId, decision, reasonCode, executiveDecision: executiveSummary.decision },
      'staging moderation decision committed'
    );

    return {
      status: 'decision_recorded',
      message_id: messageId,
      decision,
      next_queue: decision === 'escalate' ? 'safety' : 'internal_tasks',
      archived_from_moderation: true,
      executive_brief: executiveSummary
    };
  } catch (error) {
    await client.query('rollback').catch(() => {});
    app.log.error({ err: error, messageId, decision }, 'staging moderation decision failed');
    return reply.code(503).send({ error: 'moderation_decision_failed' });
  } finally {
    client.release();
  }
});

app.post('/ops/product/evaluate', { preHandler: requireOps }, async (request, reply) => {
  const body = request.body ?? {};
  const proposal = typeof body.proposal === 'string' ? body.proposal.trim().slice(0, 120) : '';
  const scores = body.scores && typeof body.scores === 'object' ? body.scores : {};
  const hardBlocks = body.hard_blocks && typeof body.hard_blocks === 'object' ? body.hard_blocks : {};

  const result = evaluateExecutiveDecision({
    kind: 'product_change',
    scores,
    hard_blocks: hardBlocks
  });

  app.log.info({
    proposal: proposal || 'unnamed',
    decision: result.decision,
    score: result.score,
    hardBlockCount: Array.isArray(result.hard_blocks) ? result.hard_blocks.length : 0
  }, 'product council evaluation');

  return {
    environment,
    engine: 'executive-decision-engine',
    authoritative: true,
    proposal: proposal || null,
    result
  };
});

const shutdown = async () => {
  try {
    await app.close();
    if (pool) await pool.end();
  } finally {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

await app.listen({ port, host });

