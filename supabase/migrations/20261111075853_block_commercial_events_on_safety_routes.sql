begin;

do $$
begin
  if to_regprocedure('public.record_commercial_event_v2(text,text,uuid,text)') is null then
    raise exception 'public.record_commercial_event_v2(text,text,uuid,text) is missing; inspect the commercial telemetry deployment before replacing it';
  end if;
end
$$;

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
  v_critical_routes constant text[] := array[
    '/ayuda-urgente.html',
    '/me-preocupa-que-alguien-pueda-suicidarse/',
    '/alguien-cercano-ha-intentado-suicidarse/',
    '/mi-pareja-me-maltrata-y-no-se-que-hacer/',
    '/he-sufrido-una-agresion-sexual-y-no-se-que-hacer/',
    '/duelo/ha-muerto-por-suicidio-alguien-que-quiero/',
    '/dinero/tengo-deudas-y-no-se-por-donde-empezar/',
    '/dinero/necesito-dinero-urgente/',
    '/dinero/no-puedo-pagar-la-vivienda/',
    '/dinero/me-da-miedo-mirar-mi-cuenta/',
    '/dinero/en-casa-discutimos-por-dinero/',
    '/violencia/',
    '/internacional.html',
    '/ayuda/es/',
    '/ayuda/en/',
    '/ayuda/fr/',
    '/ayuda/pt/',
    '/ayuda/ar/',
    '/ayuda/it/',
    '/ayuda/de/'
  ]::text[];
begin
  if v_path !~ '^/[A-Za-z0-9_./-]*$'
     or length(v_path) > 240
     or position('//' in v_path) > 0
     or position('..' in v_path) > 0
     or v_path ~ '(^|/)\.(/|$)' then
    raise exception 'Invalid path' using errcode = '22023';
  end if;

  if v_path <> '/'
     and right(v_path, 1) <> '/'
     and v_path !~ '\.html$' then
    v_path := v_path || '/';
  end if;

  if exists (
    select 1
    from unnest(v_critical_routes) as critical_route(path)
    where v_path = critical_route.path
       or (right(critical_route.path, 1) = '/' and v_path like critical_route.path || '%')
  ) then
    raise exception 'Commercial telemetry is forbidden on a Safety route' using errcode = '22023';
  end if;

  if v_event not in ('shown', 'clicked') then
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

  insert into public.commercial_events_daily(
    day, path, opportunity_id, offer_id, event_type, event_count, updated_at
  )
  values (
    (now() at time zone 'utc')::date,
    v_path,
    v_opportunity,
    p_offer_id,
    v_event,
    1,
    now()
  )
  on conflict (day, path, opportunity_id, offer_id, event_type)
  do update set
    event_count = public.commercial_events_daily.event_count + 1,
    updated_at = now();
end;
$$;

comment on function public.record_commercial_event_v2(text,text,uuid,text) is
  'Records bounded aggregate commercial events only for verified offers and non-Safety routes. Never accepts free text or sensitive-route telemetry.';

commit;
