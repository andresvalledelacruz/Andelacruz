begin;

-- Runtime comercial privacy-first. Aplicado primero en Supabase y versionado aquí como fuente auditable.
-- El catálogo público se limita a oportunidades de menor vulnerabilidad. Crisis, salud clínica,
-- violencia, menores y productos financieros de alto riesgo permanecen fuera del runtime anónimo.

create table if not exists public.commercial_events_daily (
  day date not null default (now() at time zone 'utc')::date,
  path text not null,
  opportunity_id text not null,
  offer_id uuid not null,
  event_type text not null check (event_type in ('shown','clicked')),
  event_count bigint not null default 0 check (event_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (day, path, opportunity_id, offer_id, event_type)
);

alter table public.commercial_events_daily enable row level security;
revoke all on table public.commercial_events_daily from anon, authenticated;
grant select, insert, update, delete on table public.commercial_events_daily to service_role;

create table if not exists public.commercial_conversion_receipts (
  event_ref text primary key check (event_ref ~ '^[0-9a-f]{64}$'),
  partner_id uuid not null references public.commercial_partners(id) on delete restrict,
  offer_id uuid not null references public.partner_offers(id) on delete restrict,
  opportunity_id text not null,
  value numeric(14,2) not null default 0 check (value >= 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.commercial_conversion_receipts enable row level security;
revoke all on table public.commercial_conversion_receipts from anon, authenticated;
grant select, insert, update, delete on table public.commercial_conversion_receipts to service_role;

create index if not exists commercial_events_daily_offer_idx
  on public.commercial_events_daily (offer_id, day desc);
create index if not exists commercial_conversion_receipts_partner_idx
  on public.commercial_conversion_receipts (partner_id, occurred_at desc);

create or replace function public.get_runtime_partner_offers_v2(
  p_opportunity_ids text[],
  p_territory text default 'ES',
  p_limit integer default 6
)
returns table(
  offer_id uuid,
  partner_id uuid,
  partner_name text,
  opportunity_id text,
  territory text,
  destination_url text,
  disclosure text,
  compensation_model text,
  requires_consent boolean,
  quality_score numeric
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    o.id,
    p.id,
    p.display_name,
    o.opportunity_id,
    o.territory,
    o.destination_url,
    coalesce(o.disclosure, p.disclosure),
    o.compensation_model,
    o.requires_consent,
    p.quality_score
  from public.partner_offers o
  join public.commercial_partners p on p.id = o.partner_id
  where p.status = 'active'
    and p.verification = 'verified'
    and (p.verification_expires_at is null or p.verification_expires_at > now())
    and p.quality_status <> 'suspended'
    and o.status = 'active'
    and o.territory in (upper(coalesce(nullif(p_territory,''),'ES')), '*')
    and o.opportunity_id = any(coalesce(p_opportunity_ids, array[]::text[]))
    and o.opportunity_id = any(array[
      'JOB_SEARCH','CV_SERVICE','INTERVIEW_COACHING','TRAINING',
      'SOCIAL_ACTIVITIES','MATCHMAKING','ENERGY_SWITCH','TELECOM_SWITCH','HOME_SERVICES'
    ]::text[])
    and coalesce(o.disclosure, p.disclosure) is not null
    and o.destination_url ~ '^https://[^[:space:]]+$'
  order by coalesce(p.quality_score, 50) desc, p.created_at asc, o.created_at asc
  limit least(greatest(coalesce(p_limit, 6), 1), 12);
$$;

revoke all on function public.get_runtime_partner_offers_v2(text[], text, integer) from public;
grant execute on function public.get_runtime_partner_offers_v2(text[], text, integer) to anon, authenticated, service_role;

create or replace function public.record_commercial_event_v2(
  p_path text,
  p_opportunity_id text,
  p_offer_id uuid,
  p_event_type text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_path text := split_part(coalesce(p_path, '/unknown'), '?', 1);
  v_opportunity text := upper(btrim(coalesce(p_opportunity_id, '')));
  v_event text := lower(btrim(coalesce(p_event_type, '')));
begin
  if v_path !~ '^/[A-Za-z0-9_./-]*$' or length(v_path) > 240 then
    raise exception 'Invalid path' using errcode = '22023';
  end if;
  if v_event not in ('shown','clicked') then
    raise exception 'Invalid commercial event' using errcode = '22023';
  end if;
  if v_opportunity <> all(array[
    'JOB_SEARCH','CV_SERVICE','INTERVIEW_COACHING','TRAINING',
    'SOCIAL_ACTIVITIES','MATCHMAKING','ENERGY_SWITCH','TELECOM_SWITCH','HOME_SERVICES'
  ]::text[]) then
    raise exception 'Opportunity not enabled for public commercial telemetry' using errcode = '22023';
  end if;
  if not exists (
    select 1
    from public.partner_offers o
    join public.commercial_partners p on p.id = o.partner_id
    where o.id = p_offer_id
      and o.opportunity_id = v_opportunity
      and o.status = 'active'
      and p.status = 'active'
      and p.verification = 'verified'
      and (p.verification_expires_at is null or p.verification_expires_at > now())
      and p.quality_status <> 'suspended'
  ) then
    raise exception 'Offer is not active and verified' using errcode = '22023';
  end if;

  insert into public.commercial_events_daily(day, path, opportunity_id, offer_id, event_type, event_count, updated_at)
  values ((now() at time zone 'utc')::date, v_path, v_opportunity, p_offer_id, v_event, 1, now())
  on conflict (day, path, opportunity_id, offer_id, event_type)
  do update set event_count = public.commercial_events_daily.event_count + 1, updated_at = now();
end;
$$;

revoke all on function public.record_commercial_event_v2(text, text, uuid, text) from public;
grant execute on function public.record_commercial_event_v2(text, text, uuid, text) to anon, authenticated, service_role;

create or replace function public.record_commercial_conversion_v1(
  p_event_ref text,
  p_offer_id uuid,
  p_value numeric default 0,
  p_currency text default 'EUR',
  p_occurred_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_partner uuid;
  v_opportunity text;
  v_ref text := lower(btrim(coalesce(p_event_ref,'')));
  v_currency text := upper(btrim(coalesce(p_currency,'EUR')));
begin
  if v_ref !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid event reference' using errcode = '22023';
  end if;
  if v_currency !~ '^[A-Z]{3}$' then
    raise exception 'Invalid currency' using errcode = '22023';
  end if;
  if coalesce(p_value,0) < 0 then
    raise exception 'Invalid conversion value' using errcode = '22023';
  end if;

  select o.partner_id, o.opportunity_id into v_partner, v_opportunity
  from public.partner_offers o
  join public.commercial_partners p on p.id = o.partner_id
  where o.id = p_offer_id
    and o.status = 'active'
    and p.status = 'active'
    and p.verification = 'verified';

  if v_partner is null then
    raise exception 'Unknown active offer' using errcode = '22023';
  end if;

  insert into public.commercial_conversion_receipts(event_ref, partner_id, offer_id, opportunity_id, value, currency, occurred_at)
  values (v_ref, v_partner, p_offer_id, v_opportunity, coalesce(p_value,0), v_currency, coalesce(p_occurred_at, now()))
  on conflict (event_ref) do nothing;
end;
$$;

revoke all on function public.record_commercial_conversion_v1(text, uuid, numeric, text, timestamptz) from public, anon, authenticated;
grant execute on function public.record_commercial_conversion_v1(text, uuid, numeric, text, timestamptz) to service_role;

commit;
