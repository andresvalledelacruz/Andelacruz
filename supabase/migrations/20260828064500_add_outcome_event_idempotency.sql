alter table public.recommendation_outcomes
  add column if not exists event_ref text;

create unique index if not exists recommendation_outcomes_decision_event_ref_uidx
  on public.recommendation_outcomes(decision_id, event_ref)
  where event_ref is not null;

comment on column public.recommendation_outcomes.event_ref is
  'Client-generated random event reference used only for idempotency; no user identifier.';
