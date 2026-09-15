create extension if not exists pgcrypto;

create table if not exists public.interaction_daily_analytics (
  day date not null default (now() at time zone 'utc')::date,
  path text not null,
  event_type text not null,
  target_key text not null,
  device_class text not null default 'unknown',
  events bigint not null default 0 check (events >= 0),
  updated_at timestamptz not null default now(),
  primary key (day, path, event_type, target_key, device_class),
  constraint interaction_path_safe check (path ~ '^/[A-Za-z0-9_./-]*$' and length(path) <= 240),
  constraint interaction_event_safe check (event_type in ('click','section_view','scroll_depth')),
  constraint interaction_target_safe check (target_key ~ '^[A-Za-z0-9_.:/-]+$' and length(target_key) <= 96),
  constraint interaction_device_safe check (device_class in ('mobile','tablet','desktop','unknown'))
);

comment on table public.interaction_daily_analytics is 'Privacy-safe aggregate interaction analytics. No coordinates, free text, query strings, cookies, IDs, session replay or user profiles.';

alter table public.interaction_daily_analytics enable row level security;
revoke all on public.interaction_daily_analytics from anon, authenticated;

create index if not exists interaction_daily_analytics_day_idx on public.interaction_daily_analytics(day desc);
create index if not exists interaction_daily_analytics_path_idx on public.interaction_daily_analytics(path, day desc);
create index if not exists interaction_daily_analytics_target_idx on public.interaction_daily_analytics(target_key, day desc);

create or replace function public.record_privacy_safe_interaction(
  p_path text,
  p_event_type text,
  p_target_key text,
  p_device_class text default 'unknown'
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text := split_part(coalesce(p_path, '/'), '?', 1);
  v_event text := lower(coalesce(p_event_type, ''));
  v_target text := lower(coalesce(p_target_key, ''));
  v_device text := lower(coalesce(nullif(p_device_class, ''), 'unknown'));
begin
  if v_path !~ '^/[A-Za-z0-9_./-]*$' or length(v_path) > 240 then
    return;
  end if;

  -- Never collect behavioural interaction telemetry on crisis/sensitive routes.
  if v_path = '/buscar/'
     or v_path = '/ayuda-urgente.html'
     or v_path like '/suicidio/%'
     or v_path like '/me-preocupa-que-alguien-pueda-suicidarse/%'
     or v_path like '/alguien-cercano-ha-intentado-suicidarse/%'
     or v_path like '/duelo/ha-muerto-por-suicidio-alguien-que-quiero/%'
     or v_path like '/mi-pareja-me-maltrata-y-no-se-que-hacer/%'
     or v_path like '/he-sufrido-una-agresion-sexual-y-no-se-que-hacer/%' then
    return;
  end if;

  if v_event not in ('click','section_view','scroll_depth') then
    return;
  end if;
  if v_target !~ '^[A-Za-z0-9_.:/-]+$' or length(v_target) > 96 then
    return;
  end if;
  if v_device not in ('mobile','tablet','desktop','unknown') then
    v_device := 'unknown';
  end if;

  insert into public.interaction_daily_analytics(day, path, event_type, target_key, device_class, events, updated_at)
  values ((now() at time zone 'utc')::date, v_path, v_event, v_target, v_device, 1, now())
  on conflict (day, path, event_type, target_key, device_class)
  do update set events = public.interaction_daily_analytics.events + 1, updated_at = now();
end;
$$;

revoke all on function public.record_privacy_safe_interaction(text,text,text,text) from public;
grant execute on function public.record_privacy_safe_interaction(text,text,text,text) to anon, authenticated;

comment on function public.record_privacy_safe_interaction(text,text,text,text) is 'Aggregates allow-listed UI interactions without storing coordinates, text, identifiers or sensitive search content.';

create or replace function public.get_owner_privacy_safe_analytics(
  p_owner_token text,
  p_days integer default 30
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer := greatest(1, least(coalesce(p_days, 30), 90));
  v_expected constant text := '36704f98532cfa80c93aafeea409c0ad1732c7a6ed10eb0dd9baad39b2471c19';
begin
  if encode(digest(coalesce(p_owner_token, ''), 'sha256'), 'hex') <> v_expected then
    raise exception 'unauthorized';
  end if;

  return jsonb_build_object(
    'generated_at', now(),
    'period_days', v_days,
    'pageviews_total', coalesce((
      select sum(pageviews) from public.pageview_daily_analytics
      where day >= (now() at time zone 'utc')::date - (v_days - 1)
    ), 0),
    'pageviews_today', coalesce((
      select sum(pageviews) from public.pageview_daily_analytics
      where day = (now() at time zone 'utc')::date
    ), 0),
    'pageviews_by_day', coalesce((
      select jsonb_agg(jsonb_build_object('day', day, 'pageviews', views) order by day)
      from (
        select day, sum(pageviews)::bigint as views
        from public.pageview_daily_analytics
        where day >= (now() at time zone 'utc')::date - (v_days - 1)
        group by day
      ) x
    ), '[]'::jsonb),
    'top_paths', coalesce((
      select jsonb_agg(jsonb_build_object('path', path, 'pageviews', views) order by views desc)
      from (
        select path, sum(pageviews)::bigint as views
        from public.pageview_daily_analytics
        where day >= (now() at time zone 'utc')::date - (v_days - 1)
        group by path
        order by views desc
        limit 20
      ) x
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(jsonb_build_object('device', device_class, 'pageviews', views) order by views desc)
      from (
        select device_class, sum(pageviews)::bigint as views
        from public.pageview_daily_analytics
        where day >= (now() at time zone 'utc')::date - (v_days - 1)
        group by device_class
      ) x
    ), '[]'::jsonb),
    'referrers', coalesce((
      select jsonb_agg(jsonb_build_object('referrer', referrer_host, 'pageviews', views) order by views desc)
      from (
        select referrer_host, sum(pageviews)::bigint as views
        from public.pageview_daily_analytics
        where day >= (now() at time zone 'utc')::date - (v_days - 1)
        group by referrer_host
        order by views desc
        limit 20
      ) x
    ), '[]'::jsonb),
    'countries', coalesce((
      select jsonb_agg(jsonb_build_object('country', country_code, 'pageviews', views) order by views desc)
      from (
        select country_code, sum(pageviews)::bigint as views
        from public.pageview_daily_analytics
        where day >= (now() at time zone 'utc')::date - (v_days - 1)
        group by country_code
        order by views desc
        limit 20
      ) x
    ), '[]'::jsonb),
    'top_interactions', coalesce((
      select jsonb_agg(jsonb_build_object('path', path, 'event', event_type, 'target', target_key, 'events', hits) order by hits desc)
      from (
        select path, event_type, target_key, sum(events)::bigint as hits
        from public.interaction_daily_analytics
        where day >= (now() at time zone 'utc')::date - (v_days - 1)
        group by path, event_type, target_key
        order by hits desc
        limit 30
      ) x
    ), '[]'::jsonb),
    'attention_sections', coalesce((
      select jsonb_agg(jsonb_build_object('target', target_key, 'views', hits) order by hits desc)
      from (
        select target_key, sum(events)::bigint as hits
        from public.interaction_daily_analytics
        where day >= (now() at time zone 'utc')::date - (v_days - 1)
          and event_type = 'section_view'
        group by target_key
        order by hits desc
        limit 20
      ) x
    ), '[]'::jsonb),
    'scroll_depth', coalesce((
      select jsonb_agg(jsonb_build_object('depth', target_key, 'events', hits) order by target_key)
      from (
        select target_key, sum(events)::bigint as hits
        from public.interaction_daily_analytics
        where day >= (now() at time zone 'utc')::date - (v_days - 1)
          and event_type = 'scroll_depth'
        group by target_key
      ) x
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_owner_privacy_safe_analytics(text,integer) from public;
grant execute on function public.get_owner_privacy_safe_analytics(text,integer) to anon, authenticated;

comment on function public.get_owner_privacy_safe_analytics(text,integer) is 'Owner-only aggregate analytics protected by a high-entropy access token hash. Returns no personal identifiers or free text.';
