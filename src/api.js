import Fastify from 'fastify';
import pg from 'pg';

const { Pool } = pg;
const app = Fastify({
  logger: true,
  bodyLimit: 32 * 1024
});

const port = Number(process.env.PORT || 10000);
const host = '0.0.0.0';
const environment = process.env.NODE_ENV || 'staging';
const queueNames = ['moderation', 'safety', 'internal_tasks'];
const categories = [
  'Duelo y Pérdidas',
  'Soledad',
  'Pareja y Rupturas',
  'Familia',
  'Trabajo',
  'Dinero',
  'Autoestima',
  'Amistad',
  'Conflictos',
  'Otras historias'
];
const allowedNeeds = new Set([
  'que_me_lean',
  'experiencias_similares',
  'recursos_practicos',
  'orientacion_profesional'
]);

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

const rateWindowMs = 60 * 60 * 1000;
const rateMax = 3;
const submissionsByIp = new Map();

function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') return false;
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

function applyCors(request, reply) {
  const origin = request.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    reply.header('Access-Control-Allow-Origin', origin);
    reply.header('Vary', 'Origin');
  }
  reply.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');
  reply.header('Access-Control-Max-Age', '600');
}

app.addHook('onSend', async (request, reply, payload) => {
  applyCors(request, reply);
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('Referrer-Policy', 'no-referrer');
  return payload;
});

app.options('/api/stories', async (request, reply) => {
  const origin = request.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    return reply.code(403).send({ error: 'origin_not_allowed' });
  }
  applyCors(request, reply);
  return reply.code(204).send();
});

app.get('/health', async () => ({
  status: 'ok',
  service: 'desgracias-api',
  environment,
  timestamp: new Date().toISOString()
}));

app.get('/ready', async (_request, reply) => {
  if (!pool) {
    return reply.code(503).send({ status: 'not_ready', database: 'not_configured' });
  }

  try {
    await pool.query('select 1');
    return { status: 'ready', database: 'ok' };
  } catch (error) {
    app.log.error(error);
    return reply.code(503).send({ status: 'not_ready', database: 'error' });
  }
});

app.get('/api/meta', async () => ({
  environment,
  categories,
  story_submission: environment === 'staging' ? 'enabled_for_synthetic_testing' : 'enabled'
}));

app.post('/api/stories', async (request, reply) => {
  const origin = request.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    return reply.code(403).send({ error: 'origin_not_allowed' });
  }
  if (!pool) {
    return reply.code(503).send({ error: 'database_not_configured' });
  }

  const body = request.body ?? {};
  const alias = typeof body.alias === 'string' ? body.alias.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const story = typeof body.story === 'string' ? body.story.trim() : '';
  const website = typeof body.website === 'string' ? body.website.trim() : '';
  const consent = body.consent === true;
  const synthetic = body.synthetic === true;
  const needs = Array.isArray(body.needs)
    ? body.needs.filter((item) => typeof item === 'string' && allowedNeeds.has(item)).slice(0, 4)
    : [];

  if (website) {
    return reply.code(202).send({ status: 'received' });
  }
  if (!categories.includes(category)) {
    return reply.code(400).send({ error: 'invalid_category' });
  }
  if (alias.length > 40) {
    return reply.code(400).send({ error: 'alias_too_long' });
  }
  if (title.length < 8 || title.length > 120) {
    return reply.code(400).send({ error: 'invalid_title_length' });
  }
  if (story.length < 80 || story.length > 5000) {
    return reply.code(400).send({ error: 'invalid_story_length' });
  }
  if (!consent) {
    return reply.code(400).send({ error: 'consent_required' });
  }
  if (environment === 'staging' && !synthetic) {
    return reply.code(400).send({ error: 'staging_requires_synthetic_content' });
  }

  const now = Date.now();
  const ip = request.ip || 'unknown';
  const recent = (submissionsByIp.get(ip) || []).filter((timestamp) => now - timestamp < rateWindowMs);
  if (recent.length >= rateMax) {
    return reply.code(429).send({ error: 'rate_limit', retry_after_seconds: 3600 });
  }
  recent.push(now);
  submissionsByIp.set(ip, recent);

  const message = {
    kind: 'story_submission',
    version: 1,
    environment,
    source: 'web_staging',
    submitted_at: new Date().toISOString(),
    alias: alias || null,
    category,
    title,
    story,
    needs,
    synthetic
  };

  try {
    const { rows } = await pool.query(
      'select pgmq.send($1, $2::jsonb) as msg_id',
      ['moderation', JSON.stringify(message)]
    );
    const msgId = rows[0]?.msg_id ?? null;
    app.log.info({ msgId, category, synthetic }, 'story submission queued for moderation');
    return reply.code(202).send({
      status: 'queued_for_moderation',
      submission_id: msgId,
      environment
    });
  } catch (error) {
    app.log.error({ err: error }, 'story submission queue failed');
    return reply.code(503).send({ error: 'queue_unavailable' });
  }
});

async function runStagingQueueSelfTest() {
  if (environment !== 'staging' || !pool) return;

  for (const queue of queueNames) {
    try {
      const { rows } = await pool.query('select * from pgmq.metrics($1)', [queue]);
      app.log.info({ queue, metrics: rows[0] ?? {} }, 'staging queue self-test ok');
    } catch (error) {
      app.log.error({ queue, err: error }, 'staging queue self-test failed');
    }
  }
}

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
await runStagingQueueSelfTest();
