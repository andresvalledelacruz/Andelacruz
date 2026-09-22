-- Read only. Run in the project's private Supabase SQL editor.
-- Export the snapshot cell as JSON; do not commit the result to this public repository.
select jsonb_build_object(
  'generated_at', now(),
  'source', 'public.pageview_daily_analytics',
  'timezone', 'UTC',
  'rows', coalesce((select jsonb_agg(t) from (
    select day::text, path, referrer_host, device_class, country_code,
           sum(pageviews)::bigint as pageviews
    from public.pageview_daily_analytics
    group by day, path, referrer_host, device_class, country_code
    order by day, path, referrer_host, device_class, country_code
  ) t), '[]'::jsonb)
) as snapshot;
