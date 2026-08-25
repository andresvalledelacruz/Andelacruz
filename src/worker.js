import pg from 'pg';

const { Pool } = pg;
const queues = ['moderation', 'safety', 'internal_tasks'];
const intervalMs = Number(process.env.WORKER_POLL_MS || 15000);
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function checkQueues() {
  if (!pool) {
    console.log('[worker] DATABASE_URL not configured; waiting.');
    return;
  }

  for (const queue of queues) {
    try {
      const { rows } = await pool.query('select * from pgmq.metrics($1)', [queue]);
      console.log('[worker] queue metrics', queue, rows[0] ?? {});
    } catch (error) {
      console.error('[worker] queue check failed', queue, error.message);
    }
  }
}

let running = true;
process.on('SIGTERM', () => { running = false; });
process.on('SIGINT', () => { running = false; });

console.log('[worker] Desgracias staging worker started');
while (running) {
  await checkQueues();
  await sleep(intervalMs);
}

if (pool) await pool.end();
console.log('[worker] stopped');
