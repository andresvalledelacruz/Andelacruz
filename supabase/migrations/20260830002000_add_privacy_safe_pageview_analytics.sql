create table if not exists public.pageview_daily_analytics (
  day date not null default (now() at time zone 'utc')::date,
  path text not null,
  referrer_host text not null default 'direct',
  country_code text not null default 'unknown',
  device_class text not null default 'unknown',
  pageviews bigint not null default 0 check (pageviews >= 0),
  updated_at timestamptz not null default now(),
  primary key (day, path, referrer_host, country_code, device_class),
  constraint pageview_path_safe check (path ~ '^/[A-Za-z0-9_./-]*$' and length(path) <= 240),
  constraint pageview_referrer_safe check (referrer_host ~ '^[A-Za-z0-9.-]+$' and length(referrer_host) <= 120),
  constraint pageview_country_safe check (country_code = 'unknown' or country_code ~ '^[A-Z]{2}$'),
  constraint pageview_device_safe check (device_class in ('mobile','tablet','desktop','bot','unknown'))
);

comment on table public.pageview_daily_analytics is 'Privacy-safe aggregate web analytics. No IPs, cookies, user IDs, query strings, payloads or free text.';

alter table public.pageview_daily_analytics enable row level security;
revoke all on public.pageview_daily_analytics from anon, authenticated;

create index if not exists pageview_daily_analytics_day_idx on public.pageview_daily_analytics(day desc);
create index if not exists pageview_daily_analytics_path_idx on public.pageview_daily_analytics(path, day desc);

create or replace function public.record_privacy_safe_pageview(
  p_path text,
  p_referrer_host text default 'direct',
  p_country_code text default 'unknown',
  p_device_class text default 'unknown'
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text := split_part(coalesce(p_path, '/'), '?', 1);
  v_referrer text := lower(coalesce(nullif(p_referrer_host, ''), 'direct'));
  v_country text := upper(coalesce(nullif(p_country_code, ''), 'unknown'));
  v_device text := lower(coalesce(nullif(p_device_class, ''), 'unknown'));
begin
  if v_path !~ '^/[A-Za-z0-9_./-]*$' or length(v_path) > 240 then
    v_path := '/unknown';
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

  insert into public.pageview_daily_analytics(day, path, referrer_host, country_code, device_class, pageviews, updated_at)
  values ((now() at time zone 'utc')::date, v_path, v_referrer, v_country, v_device, 1, now())
  on conflict (day, path, referrer_host, country_code, device_class)
  do update set pageviews = public.pageview_daily_analytics.pageviews + 1, updated_at = now();
end;
$$;

revoke all on function public.record_privacy_safe_pageview(text,text,text,text) from public;
grant execute on function public.record_privacy_safe_pageview(text,text,text,text) to anon, authenticated;

comment on function public.record_privacy_safe_pageview(text,text,text,text) is 'Aggregates one pageview without storing IP, cookies, user/session IDs, query strings or free text.';
