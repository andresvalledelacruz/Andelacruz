import Fastify from 'fastify';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

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

    return {
      environment,
      queue: 'moderation',
      count: rows.length,
      items: rows.map((row) => ({
        message_id: String(row.msg_id),
        read_count: Number(row.read_ct || 0),
        enqueued_at: row.enqueued_at,
        visible_at: row.vt,
        payload: row.message
      }))
    };
  } catch (error) {
    app.log.error({ err: error }, 'moderation queue read failed');
    return reply.code(503).send({ error: 'moderation_queue_unavailable' });
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
    const decidedAt = new Date().toISOString();
    const auditEvent = {
      kind: 'moderation_decision',
      version: 1,
      environment,
      source: 'ops_staging',
      actor: 'staging_ops_token',
      moderation_message_id: String(item.msg_id),
      decision,
      reason_code: reasonCode,
      note: note || null,
      decided_at: decidedAt,
      synthetic: original.synthetic === true
    };

    if (decision === 'approve') {
      await client.query(
        'select pgmq.send($1, $2::jsonb)',
        ['internal_tasks', JSON.stringify({
          ...auditEvent,
          task: 'publish_story_candidate',
          story_submission: original
        })]
      );
    } else if (decision === 'escalate') {
      await client.query(
        'select pgmq.send($1, $2::jsonb)',
        ['safety', JSON.stringify({
          ...auditEvent,
          task: 'human_safety_review',
          story_submission: original
        })]
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
    app.log.info({ messageId, decision, reasonCode }, 'staging moderation decision committed');

    return {
      status: 'decision_recorded',
      message_id: messageId,
      decision,
      next_queue: decision === 'escalate' ? 'safety' : 'internal_tasks',
      archived_from_moderation: true
    };
  } catch (error) {
    await client.query('rollback').catch(() => {});
    app.log.error({ err: error, messageId, decision }, 'staging moderation decision failed');
    return reply.code(503).send({ error: 'moderation_decision_failed' });
  } finally {
    client.release();
  }
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
