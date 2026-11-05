import pg from 'pg';
import {
  planExpiredProfessionalApplications,
  professionalRetentionPurgeConfiguration,
  purgeExpiredProfessionalApplications
} from '../src/professional-intake.js';

const configuration = professionalRetentionPurgeConfiguration();
if (!configuration.enabled) {
  console.error('professional_retention_purge_disabled');
  process.exitCode = 2;
} else if (!process.env.DATABASE_URL) {
  console.error('professional_retention_database_unavailable');
  process.exitCode = 2;
} else {
  const pool = new pg.Pool({ connectionString:process.env.DATABASE_URL, ssl:{ rejectUnauthorized:false }, max:1 });
  try {
    const planning = configuration.mode === 'plan';
    const summary = planning
      ? await planExpiredProfessionalApplications(pool, { configuration })
      : await purgeExpiredProfessionalApplications(pool, { configuration });
    // Aggregate counts only: never print receipts, contact data, evidence or payloads.
    console.log(JSON.stringify({ status:planning ? 'planned' : 'completed', ...summary }));
  } catch (cause) {
    console.error(cause?.code || 'professional_retention_purge_unavailable');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
