begin;

do $$
begin
  if to_regclass('private.professional_retention_purge_receipts') is not null then
    raise exception 'private.professional_retention_purge_receipts already exists; inspect its schema before applying this migration';
  end if;
end
$$;

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

comment on table private.professional_retention_purge_receipts is
  'Private, aggregate-only receipts that make a confirmed professional retention purge plan single-use.';

alter table private.professional_retention_purge_receipts enable row level security;
revoke all on private.professional_retention_purge_receipts from public, anon, authenticated;

commit;
