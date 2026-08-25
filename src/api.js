import Fastify from 'fastify';
import pg from 'pg';

const { Pool } = pg;
const app = Fastify({ logger: true });
const port = Number(process.env.PORT || 10000);
const host = '0.0.0.0';
const queueNames = ['moderation', 'safety', 'internal_tasks'];

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

app.get('/health', async () => ({
  status: 'ok',
  service: 'desgracias-api',
  environment: process.env.NODE_ENV || 'staging',
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

async function runStagingQueueSelfTest() {
  if (process.env.NODE_ENV !== 'staging' || !pool) return;

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
