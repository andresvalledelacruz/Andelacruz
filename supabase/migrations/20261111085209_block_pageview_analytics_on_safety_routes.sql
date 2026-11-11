begin;

do $$
begin
  if to_regprocedure('public.record_privacy_safe_pageview(text,text,text,text)') is null then
    raise exception 'Expected public.record_privacy_safe_pageview(text,text,text,text) before applying migration';
  end if;
end
$$;

create or replace function public.record_privacy_safe_pageview(
  p_path text,
  p_referrer_host text default 'direct',
  p_country_code text default 'unknown',
  p_device_class text default 'unknown'
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_path text := split_part(coalesce(p_path, ''), '?', 1);
  v_referrer text := lower(coalesce(nullif(p_referrer_host, ''), 'direct'));
  v_country text := upper(coalesce(nullif(p_country_code, ''), 'unknown'));
  v_device text := lower(coalesce(nullif(p_device_class, ''), 'unknown'));
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
  if v_path = ''
     or v_path !~ '^/[A-Za-z0-9_./-]*$'
     or length(v_path) > 240
     or position('//' in v_path) > 0
     or position('..' in v_path) > 0
     or v_path ~ '(^|/)\.(\/|$)' then
    return;
  end if;

  if exists (
    select 1
    from unnest(v_critical_routes) as critical_route(path)
    where v_path = critical_route.path
       or v_path like critical_route.path || '%'
       or (
         right(critical_route.path, 1) = '/'
         and v_path = left(critical_route.path, -1)
       )
  ) then
    return;
  end if;

  if v_referrer !~ '^[A-Za-z0-9.-]+$' or length(v_referrer) > 120 then
    v_referrer := 'unknown';
  end if;
  if v_country <> 'UNKNOWN' and v_country !~ '^[A-Z]{2}$' then
    v_country := 'UNKNOWN';
  end if;
  v_country := case when v_country = 'UNKNOWN' then 'unknown' else v_country end;
  if v_device not in ('mobile','tablet','desktop','bot','unknown') then
    v_device := 'unknown';
  end if;

  insert into public.pageview_daily_analytics(
    day, path, referrer_host, country_code, device_class, pageviews, updated_at
  ) values (
    (now() at time zone 'utc')::date, v_path, v_referrer, v_country, v_device, 1, now()
  )
  on conflict (day, path, referrer_host, country_code, device_class)
  do update set
    pageviews = public.pageview_daily_analytics.pageviews + 1,
    updated_at = now();
end;
$$;

comment on function public.record_privacy_safe_pageview(text,text,text,text) is
  'Aggregates one pageview without identifiers or free text; ignores malformed and P0/P1 Safety paths.';

commit;
