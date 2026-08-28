create table if not exists public.commercial_partners (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  legal_name text not null check (char_length(legal_name) between 2 and 200),
  display_name text not null check (char_length(display_name) between 2 and 120),
  website_domain text,
  status text not null default 'draft' check (status in ('draft','active','paused','rejected')),
  verification text not null default 'pending' check (verification in ('pending','verified','expired','rejected')),
  verified_at timestamptz,
  verification_expires_at timestamptz,
  disclosure text not null default 'Podemos recibir una compensación si utilizas este servicio.' check (char_length(disclosure) between 10 and 500),
  quality_score numeric(5,2) check (quality_score is null or quality_score between 0 and 100),
  quality_status text not null default 'new' check (quality_status in ('new','healthy','watch','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((verification <> 'verified') or verified_at is not null),
  check (verification_expires_at is null or verified_at is null or verification_expires_at > verified_at)
);

create table if not exists public.partner_offers (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.commercial_partners(id) on delete cascade,
  opportunity_id text not null check (opportunity_id in (
    'JOB_SEARCH','CV_SERVICE','INTERVIEW_COACHING','TRAINING','LEGAL_LABOR','LEGAL_FINANCE','FAMILY_LEGAL',
    'PSYCHOLOGY','COUPLES_THERAPY','FAMILY_THERAPY','RELATIONSHIP_SUPPORT','FAMILY_MEDIATION','SOCIAL_ACTIVITIES','MATCHMAKING',
    'DEBT_CONSOLIDATION','LOAN','DEBT_ADVICE','INSOLVENCY_LEGAL','MORTGAGE_HELP','INSURANCE',
    'ENERGY_SWITCH','TELECOM_SWITCH','CARE_SERVICES','SENIOR_RESIDENCE','HOME_SERVICES'
  )),
  territory text not null default 'ES' check (char_length(territory) between 1 and 12),
  status text not null default 'draft' check (status in ('draft','active','paused','rejected')),
  compensation_model text not null check (compensation_model in ('affiliate','cpl','cpa','booking','revenue_share','marketplace')),
  destination_url text not null check (destination_url ~ '^https://'),
  disclosure text check (disclosure is null or char_length(disclosure) between 10 and 500),
  requires_consent boolean not null default true,
  regulatory_notes text check (regulatory_notes is null or char_length(regulatory_notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(partner_id, opportunity_id, territory)
);

create table if not exists public.partner_verification_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.commercial_partners(id) on delete cascade,
  actor_user_id uuid,
  event_type text not null check (event_type in ('submitted','verified','renewed','expired','paused','rejected','quality_watch','quality_suspended','reactivated')),
  reason_code text,
  evidence_summary_redacted text check (evidence_summary_redacted is null or char_length(evidence_summary_redacted) <= 1000),
  created_at timestamptz not null default now()
);

alter table public.commercial_partners enable row level security;
alter table public.partner_offers enable row level security;
alter table public.partner_verification_events enable row level security;

revoke all on table public.commercial_partners from anon, authenticated;
revoke all on table public.partner_offers from anon, authenticated;
revoke all on table public.partner_verification_events from anon, authenticated;
grant all on table public.commercial_partners to service_role;
grant all on table public.partner_offers to service_role;
grant all on table public.partner_verification_events to service_role;

create index if not exists partner_offers_runtime_idx on public.partner_offers(opportunity_id, territory, status);
create index if not exists commercial_partners_runtime_idx on public.commercial_partners(status, verification, quality_status);

create or replace function public.get_runtime_partner_offers(p_territory text default 'ES')
returns table(
  partner_id uuid,
  partner_name text,
  opportunity_id text,
  territory text,
  disclosure text,
  quality_score numeric
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    p.id,
    p.display_name,
    o.opportunity_id,
    o.territory,
    coalesce(o.disclosure, p.disclosure),
    p.quality_score
  from public.partner_offers o
  join public.commercial_partners p on p.id = o.partner_id
  where p.status = 'active'
    and p.verification = 'verified'
    and (p.verification_expires_at is null or p.verification_expires_at > now())
    and p.quality_status <> 'suspended'
    and o.status = 'active'
    and o.territory in (p_territory, '*')
    and coalesce(o.disclosure, p.disclosure) is not null
  order by coalesce(p.quality_score, 50) desc, p.created_at asc;
$$;

revoke all on function public.get_runtime_partner_offers(text) from public, anon, authenticated;
grant execute on function public.get_runtime_partner_offers(text) to service_role;
