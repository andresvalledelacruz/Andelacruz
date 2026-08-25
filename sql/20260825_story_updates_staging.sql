-- Desgracias.es · staging only
-- Author updates are append-only candidates that require human moderation.

alter table if exists staging_published_stories
  add column if not exists author_update_key_hash char(64);

create table if not exists staging_story_update_candidates (
  id bigserial primary key,
  story_id bigint not null references staging_published_stories(id) on delete cascade,
  phase text not null check (phase in (
    'dias_despues','semanas_despues','mes_1','mes_3','mes_6','ano_1','otro'
  )),
  update_text text not null check (char_length(update_text) between 80 and 3000),
  synthetic boolean not null default true,
  submitted_at timestamptz not null default now(),
  status text not null default 'pending_moderation' check (status in (
    'pending_moderation','approved','rejected','escalated'
  )),
  moderation_message_id bigint unique,
  decided_at timestamptz,
  decision_reason text
);

create index if not exists staging_story_update_candidates_story_idx
  on staging_story_update_candidates (story_id, submitted_at desc);

create index if not exists staging_story_update_candidates_status_idx
  on staging_story_update_candidates (status, submitted_at asc);

create table if not exists staging_story_updates (
  id bigserial primary key,
  story_id bigint not null references staging_published_stories(id) on delete cascade,
  candidate_id bigint not null unique references staging_story_update_candidates(id) on delete restrict,
  phase text not null,
  update_text text not null,
  synthetic boolean not null default true,
  published_at timestamptz not null default now(),
  status text not null default 'published' check (status in ('published','withdrawn'))
);

create index if not exists staging_story_updates_story_published_idx
  on staging_story_updates (story_id, published_at asc);

comment on table staging_story_update_candidates is
  'Staging-only author update candidates. Every candidate requires human moderation before publication.';

comment on column staging_published_stories.author_update_key_hash is
  'SHA-256 hash of the browser-held author update secret. The raw secret must never be stored.';
