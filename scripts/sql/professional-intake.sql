-- Private professional intake; additive and disabled at the HTTP layer by default.
-- No application, review evidence, or contact data enters the public directory.
begin;
create table private.professional_applications (
  receipt_id uuid primary key,
  request_id uuid not null unique,
  payload_digest text not null check (payload_digest ~ '^[a-f0-9]{64}$'),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  privacy_reference text not null,
  received_at timestamptz not null,
  expires_at timestamptz not null check (expires_at > received_at and expires_at <= received_at + interval '90 days'),
  synthetic boolean not null default true,
  status text not null default 'pending_review' check (status in ('pending_review','approved_for_publication','rejected','withdrawn')),
  public_profile jsonb
);
create index professional_applications_received_at_idx on private.professional_applications(received_at);
create index professional_applications_expiry_idx on private.professional_applications(expires_at);
create table private.professional_review_events (
  id bigint generated always as identity primary key,
  receipt_id uuid not null references private.professional_applications(receipt_id) on delete cascade,
  actor_subject uuid not null,
  decision text not null check (decision in ('approve_for_publication','reject','withdraw')),
  publication_authorization_reference text,
  decided_at timestamptz not null
);
create index professional_review_events_receipt_idx on private.professional_review_events(receipt_id);
create table private.professional_retention_purge_receipts (
  plan_id uuid primary key,
  cutoff timestamptz not null,
  batch_size integer not null check (batch_size between 1 and 1000),
  scope text not null check (scope in ('synthetic-only','all-expired')),
  eligible integer not null check (eligible >= 0 and eligible <= batch_size),
  synthetic integer not null check (synthetic >= 0 and synthetic <= eligible),
  non_synthetic integer not null check (non_synthetic >= 0 and non_synthetic <= eligible),
  completed_at timestamptz not null,
  check (synthetic + non_synthetic = eligible),
  check (completed_at >= cutoff and completed_at <= cutoff + interval '15 minutes')
);
alter table private.professional_applications enable row level security;
alter table private.professional_review_events enable row level security;
alter table private.professional_retention_purge_receipts enable row level security;
revoke all on private.professional_applications, private.professional_review_events,
  private.professional_retention_purge_receipts from public, anon, authenticated;
revoke all on sequence private.professional_review_events_id_seq from public, anon, authenticated;
comment on table private.professional_applications is 'Private intake, never exposed via Data API. Retention purging must be configured before real activation.';
comment on table private.professional_retention_purge_receipts is 'Private aggregate receipts that make signed retention confirmations single-use; contains no application identifiers or payloads.';
commit;
