import pg from 'pg';
import { evaluateCriticalSafety } from './critical-safety-taxonomy.js';
import { normalizeAuthorUpdateKeyHash } from './story-publish-author-key.js';
import {
  normalizeStoryUpdateCandidateId,
  safetyLevelBlocksAutomaticUpdatePublication
} from './story-update-moderation.js';

const { Pool } = pg;
const environment = process.env.NODE_ENV || 'staging';
const pollMs = Number(process.env.PUBLISH_PROCESSOR_POLL_MS || 5000);
const connectionString = process.env.DATABASE_URL || '';

const pool = connectionString
  ? new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 2 })
  : null;

let stopped = false;
let timer = null;

function slugify(value) {
  return String(value || 'historia')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'historia';
}

async function ensureSchema() {
  if (!pool || environment !== 'staging') return;
  await pool.query(`
    create table if not exists staging_published_stories (
      id bigserial primary key,
      source_moderation_message_id bigint not null unique,
      slug text not null unique,
      alias text,
      category text not null,
      title text not null,
      story text not null,
      needs jsonb not null default '[]'::jsonb,
      synthetic boolean not null default true,
      submitted_at timestamptz,
      approved_at timestamptz not null,
      published_at timestamptz not null default now(),
      nadie_solo_eligible boolean not null default true,
      publication_version integer not null default 1,
      status text not null default 'published' check (status in ('published','withdrawn')),
      author_update_key_hash char(64)
    )
  `);
  await pool.query(`
    alter table staging_published_stories
      add column if not exists author_update_key_hash char(64)
  `);
  await pool.query(`
    create index if not exists staging_published_stories_published_at_idx
      on staging_published_stories (published_at desc)
  `);
  await pool.query(`
    create table if not exists staging_story_update_candidates (
      id bigserial primary key,
      story_id bigint not null references staging_published_stories(id) on delete cascade,
      phase text not null,
      update_text text not null,
      synthetic boolean not null default true,
      submitted_at timestamptz not null default now(),
      status text not null default 'pending_moderation' check (
        status in ('pending_moderation','approved','rejected','escalated')
      ),
      moderation_message_id bigint unique,
      decided_at timestamptz,
      decision_reason text
    )
  `);
  await pool.query(`
    create table if not exists staging_story_updates (
      id bigserial primary key,
      story_id bigint not null references staging_published_stories(id) on delete cascade,
      candidate_id bigint not null unique references staging_story_update_candidates(id) on delete restrict,
      phase text not null,
      update_text text not null,
      synthetic boolean not null default true,
      published_at timestamptz not null default now(),
      status text not null default 'published' check (status in ('published','withdrawn'))
    )
  `);
}

async function rerouteCriticalStory(client, messageId, event, submission, safety) {
  const submissionField = event.task === 'publish_story_update_candidate'
    ? { story_update_submission: submission }
    : { story_submission: submission };
  await client.query(
    'select pgmq.send($1, $2::jsonb)',
    ['safety', JSON.stringify({
      kind: 'publication_safety_guard',
      version: 1,
      environment,
      source: 'publish_processor',
      task: 'human_safety_review',
      publication_blocked: true,
      moderation_message_id: String(event.moderation_message_id || ''),
      detected_at: new Date().toISOString(),
      synthetic: submission.synthetic === true,
      safety: {
        level: safety.level,
        matched_groups: safety.matched_groups,
        official_resources_spain: safety.official_resources_spain
      },
      ...submissionField
    })]
  );

  const archived = await client.query(
    'select pgmq.archive($1, $2::bigint) as archived',
    ['internal_tasks', messageId]
  );
  if (archived.rows[0]?.archived !== true) throw new Error('critical_task_archive_failed');
}

async function processOne(messageId) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const { rows } = await client.query(
      `select msg_id, message
       from pgmq.q_internal_tasks
       where msg_id = $1::bigint
         and vt <= now()
       for update`,
      [messageId]
    );
    const queued = rows[0];
    if (!queued) {
      await client.query('rollback');
      return false;
    }

    const event = queued.message || {};
    if (event.task !== 'publish_story_candidate' || !event.story_submission) {
      await client.query('rollback');
      return false;
    }

    const submission = event.story_submission;
    if (environment === 'staging' && submission.synthetic !== true) {
      throw new Error('staging_publish_requires_synthetic_story');
    }

    const safety = evaluateCriticalSafety({
      title: submission.title,
      story: submission.story
    });
    if (safety.safety_gateway) {
      await rerouteCriticalStory(client, messageId, event, submission, safety);
      await client.query('commit');
      console.warn('[publish-processor] publication blocked by safety gateway', {
        internal_task_id: String(messageId),
        moderation_message_id: String(event.moderation_message_id || ''),
        safety_level: safety.level,
        rerouted_to: 'safety'
      });
      return true;
    }

    const moderationId = Number(event.moderation_message_id);
    if (!Number.isSafeInteger(moderationId) || moderationId <= 0) {
      throw new Error('invalid_moderation_message_id');
    }

    const title = String(submission.title || '').trim();
    const story = String(submission.story || '').trim();
    const category = String(submission.category || '').trim();
    if (!title || !story || !category) throw new Error('invalid_story_submission');

    const slug = `${slugify(title)}-${moderationId}`;
    const needs = Array.isArray(submission.needs) ? submission.needs.slice(0, 4) : [];
    const approvedAt = event.decided_at ? new Date(event.decided_at) : new Date();
    const submittedAt = submission.submitted_at ? new Date(submission.submitted_at) : null;
    const authorUpdateKeyHash = normalizeAuthorUpdateKeyHash(submission.author_update_key_hash);

    await client.query(
      `insert into staging_published_stories (
         source_moderation_message_id, slug, alias, category, title, story, needs,
         synthetic, submitted_at, approved_at, published_at, nadie_solo_eligible,
         author_update_key_hash
       ) values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,now(),true,$11)
       on conflict (source_moderation_message_id) do nothing`,
      [
        moderationId,
        slug,
        submission.alias || null,
        category,
        title,
        story,
        JSON.stringify(needs),
        submission.synthetic === true,
        submittedAt,
        approvedAt,
        authorUpdateKeyHash
      ]
    );

    const archived = await client.query(
      'select pgmq.archive($1, $2::bigint) as archived',
      ['internal_tasks', messageId]
    );
    if (archived.rows[0]?.archived !== true) throw new Error('internal_task_archive_failed');

    await client.query('commit');
    console.log('[publish-processor] story published', {
      internal_task_id: String(messageId),
      moderation_message_id: String(moderationId),
      slug,
      synthetic: submission.synthetic === true
    });
    return true;
  } catch (error) {
    await client.query('rollback').catch(() => {});
    console.error('[publish-processor] publish failed', {
      internal_task_id: String(messageId),
      error: error?.message || 'unknown_error'
    });
    return false;
  } finally {
    client.release();
  }
}

async function processStoryUpdate(messageId) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const { rows } = await client.query(
      `select msg_id, message
       from pgmq.q_internal_tasks
       where msg_id = $1::bigint and vt <= now()
       for update`,
      [messageId]
    );
    const queued = rows[0];
    if (!queued) {
      await client.query('rollback');
      return false;
    }
    const event = queued.message || {};
    const submission = event.story_update_submission;
    if (event.task !== 'publish_story_update_candidate' || !submission) {
      await client.query('rollback');
      return false;
    }
    if (event.decision !== 'approve') throw new Error('story_update_not_approved');
    if (environment === 'staging' && submission.synthetic !== true) {
      throw new Error('staging_publish_requires_synthetic_story_update');
    }

    const candidateId = normalizeStoryUpdateCandidateId(submission);
    const storyId = Number(submission.story_id);
    if (!Number.isSafeInteger(storyId) || storyId <= 0) throw new Error('invalid_story_id');
    const safety = evaluateCriticalSafety({ story: submission.text });
    if (safetyLevelBlocksAutomaticUpdatePublication(safety.level)) {
      await client.query(
        `update staging_story_update_candidates
            set status = 'escalated', decided_at = now(), decision_reason = 'crisis_or_safeguarding'
          where id = $1 and story_id = $2`,
        [candidateId, storyId]
      );
      await rerouteCriticalStory(client, messageId, event, submission, safety);
      await client.query('commit');
      return true;
    }

    const candidate = await client.query(
      `select id, story_id, phase, update_text, synthetic
       from staging_story_update_candidates
       where id = $1 and story_id = $2 and status = 'approved'
       for update`,
      [candidateId, storyId]
    );
    const row = candidate.rows[0];
    if (!row) throw new Error('story_update_candidate_not_approved');
    if (row.synthetic !== true || row.phase !== submission.phase || row.update_text !== submission.text) {
      throw new Error('story_update_candidate_payload_mismatch');
    }

    await client.query(
      `insert into staging_story_updates
         (story_id, candidate_id, phase, update_text, synthetic, published_at, status)
       values ($1,$2,$3,$4,true,now(),'published')
       on conflict (candidate_id) do nothing`,
      [storyId, candidateId, row.phase, row.update_text]
    );
    const archived = await client.query(
      'select pgmq.archive($1, $2::bigint) as archived',
      ['internal_tasks', messageId]
    );
    if (archived.rows[0]?.archived !== true) throw new Error('internal_task_archive_failed');
    await client.query('commit');
    console.log('[publish-processor] story update published', {
      internal_task_id: String(messageId), candidate_id: String(candidateId), story_id: String(storyId)
    });
    return true;
  } catch (error) {
    await client.query('rollback').catch(() => {});
    console.error('[publish-processor] story update publish failed', {
      internal_task_id: String(messageId), error: error?.message || 'unknown_error'
    });
    return false;
  } finally {
    client.release();
  }
}

async function tick() {
  if (stopped || !pool || environment !== 'staging') return;
  try {
    await ensureSchema();
    const { rows } = await pool.query(
      `select msg_id, message->>'task' as task
       from pgmq.q_internal_tasks
       where vt <= now()
         and message->>'task' in ('publish_story_candidate','publish_story_update_candidate')
       order by msg_id asc
       limit 5`
    );
    for (const row of rows) {
      if (row.task === 'publish_story_update_candidate') await processStoryUpdate(row.msg_id);
      else await processOne(row.msg_id);
    }
  } catch (error) {
    console.error('[publish-processor] cycle failed', error?.message || 'unknown_error');
  } finally {
    if (!stopped) timer = setTimeout(tick, pollMs);
  }
}

async function shutdown() {
  stopped = true;
  if (timer) clearTimeout(timer);
  if (pool) await pool.end().catch(() => {});
}

if (environment === 'staging' && pool) {
  console.log('[publish-processor] staging publication processor enabled');
  void tick();
} else {
  console.log('[publish-processor] disabled', {
    environment,
    database_configured: Boolean(pool)
  });
}

process.once('beforeExit', shutdown);
