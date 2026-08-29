import pg from 'pg';

const { Pool } = pg;
const queues = ['moderation', 'safety', 'internal_tasks'];
const intervalMs = Number(process.env.WORKER_POLL_MS || 15000);
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeQueueMetric(queue, metric = {}) {
  const visible = Number(metric.queue_length ?? metric.visible ?? metric.msg_count ?? 0);
  const total = Number(metric.total_messages ?? metric.total ?? metric.message_count ?? visible);
  const oldestAgeSeconds = Number(metric.oldest_msg_age_sec ?? metric.oldest_age_seconds ?? 0);

  return {
    event: 'queue_health',
    service: 'desgracias-worker',
    queue,
    visible_bucket: Number.isFinite(visible) && visible > 0 ? (visible < 10 ? '1_9' : visible < 100 ? '10_99' : 'gte_100') : '0',
    total_bucket: Number.isFinite(total) && total > 0 ? (total < 10 ? '1_9' : total < 100 ? '10_99' : 'gte_100') : '0',
    oldest_age_bucket: Number.isFinite(oldestAgeSeconds) && oldestAgeSeconds > 0
      ? (oldestAgeSeconds < 60 ? 'lt_1m' : oldestAgeSeconds < 300 ? '1_4m' : oldestAgeSeconds < 1800 ? '5_29m' : 'gte_30m')
      : 'none',
    privacy_mode: 'no_pii_no_payload'
  };
}

async function checkQueues() {
  if (!pool) {
    console.log(JSON.stringify({
      event: 'worker_readiness',
      service: 'desgracias-worker',
      database: 'unconfigured',
      privacy_mode: 'no_pii_no_payload'
    }));
    return;
  }

  for (const queue of queues) {
    try {
      const { rows } = await pool.query('select * from pgmq.metrics($1)', [queue]);
      console.log(JSON.stringify(normalizeQueueMetric(queue, rows[0] ?? {})));
    } catch {
      console.error(JSON.stringify({
        event: 'queue_health',
        service: 'desgracias-worker',
        queue,
        outcome: 'check_failed',
        privacy_mode: 'no_pii_no_payload'
      }));
    }
  }
}

let running = true;
process.on('SIGTERM', () => { running = false; });
process.on('SIGINT', () => { running = false; });

console.log(JSON.stringify({ event: 'worker_lifecycle', service: 'desgracias-worker', state: 'started', privacy_mode: 'no_pii_no_payload' }));
while (running) {
  await checkQueues();
  await sleep(intervalMs);
}

if (pool) await pool.end();
console.log(JSON.stringify({ event: 'worker_lifecycle', service: 'desgracias-worker', state: 'stopped', privacy_mode: 'no_pii_no_payload' }));
