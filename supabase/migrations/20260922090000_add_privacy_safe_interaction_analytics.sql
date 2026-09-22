create table if not exists public.interaction_daily_analytics (
  day date not null default (now() at time zone 'utc')::date,
  path text not null,
  event_type text not null,
  target_key text not null,
  events bigint not null default 0 check (events >= 0),
  updated_at timestamptz not null default now(),
  primary key (day, path, event_type, target_key),
  constraint interaction_path_safe check (path = '/'),
  constraint interaction_event_safe check (event_type in ('click','scroll')),
  constraint interaction_target_safe check (target_key ~ '^[a-z0-9_:-]{2,64}$')
);

comment on table public.interaction_daily_analytics is 'Privacy-safe aggregate homepage interaction analytics. No text, IP, cookie, user/session ID, query string or persistent identifier.';
alter table public.interaction_daily_analytics enable row level security;
revoke all on public.interaction_daily_analytics from anon, authenticated;
create index if not exists interaction_daily_analytics_day_idx on public.interaction_daily_analytics(day desc);

create or replace function public.record_privacy_safe_interaction(p_path text,p_event_type text,p_target_key text) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_path text := case when coalesce(p_path,'/') = '/index.html' then '/' else coalesce(p_path,'/') end;
  v_event text := lower(coalesce(p_event_type,''));
  v_target text := lower(coalesce(p_target_key,''));
  v_allowed_clicks text[] := array['header_urgent','header_story','hero_urgent','hero_search','hero_stories','needs_urgent','needs_search','needs_stories','resources_all','stories_topics','nav_search','nav_stories','nav_resources','nav_professionals','nav_contact','resource_suicide','resource_violence','resource_grief','resource_anxiety','resource_emotions','resource_loneliness','resource_health','resource_work_money','resource_breakups','resource_family'];
  v_allowed_scroll text[] := array['depth_25','depth_50','depth_75','depth_90','depth_100'];
begin
  if v_path <> '/' then return; end if;
  if v_event = 'click' and not (v_target = any(v_allowed_clicks)) then return; end if;
  if v_event = 'scroll' and not (v_target = any(v_allowed_scroll)) then return; end if;
  if v_event not in ('click','scroll') then return; end if;
  insert into public.interaction_daily_analytics(day,path,event_type,target_key,events,updated_at)
  values ((now() at time zone 'utc')::date,'/',v_event,v_target,1,now())
  on conflict (day,path,event_type,target_key)
  do update set events=public.interaction_daily_analytics.events+1, updated_at=now();
end;
$$;
revoke all on function public.record_privacy_safe_interaction(text,text,text) from public;
grant execute on function public.record_privacy_safe_interaction(text,text,text) to anon, authenticated;
comment on function public.record_privacy_safe_interaction(text,text,text) is 'Records only whitelisted aggregate homepage clicks and scroll-depth buckets; never free text or persistent user identifiers.';
