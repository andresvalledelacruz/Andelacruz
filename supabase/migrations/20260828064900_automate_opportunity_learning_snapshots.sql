alter table public.opportunity_learning_snapshots
  add column if not exists snapshot_date date;

update public.opportunity_learning_snapshots
set snapshot_date = (coalesce(source_window_end, created_at) at time zone 'utc')::date
where snapshot_date is null;

alter table public.opportunity_learning_snapshots
  alter column snapshot_date set default ((now() at time zone 'utc')::date),
  alter column snapshot_date set not null;

create unique index if not exists opportunity_learning_snapshots_daily_uidx
  on public.opportunity_learning_snapshots(opportunity_id, snapshot_date);

create or replace function public.refresh_opportunity_learning_snapshots(
  p_window_days integer default 30
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_start timestamptz;
  v_snapshot_date date := (now() at time zone 'utc')::date;
  v_rows integer := 0;
begin
  if p_window_days < 7 or p_window_days > 180 then
    raise exception 'window_days_out_of_range';
  end if;

  v_start := v_now - make_interval(days => p_window_days);

  with scored as (
    select
      opportunity_id,
      case outcome_type
        when 'viewed' then 0.15
        when 'clicked' then 0.35
        when 'used_resource' then 0.55
        when 'consented' then 0.65
        when 'lead' then 0.80
        when 'converted' then 1.00
        when 'helpful' then 0.75
        when 'no_action' then -0.10
        when 'not_helpful' then -0.65
        else 0.00
      end::numeric as outcome_value
    from public.recommendation_outcomes
    where opportunity_id is not null
      and created_at >= v_start
      and created_at <= v_now
  ), aggregated as (
    select
      opportunity_id,
      count(*)::integer as sample_size,
      greatest(-100::numeric, least(100::numeric, round(avg(outcome_value) * 100, 2))) as outcome_score,
      round(least(1::numeric, count(*)::numeric / 50::numeric) * 0.80, 2) as confidence,
      case
        when count(*) >= 50 then 'measured'
        when count(*) >= 10 then 'partial'
        else 'early'
      end as status
    from scored
    group by opportunity_id
  ), upserted as (
    insert into public.opportunity_learning_snapshots (
      opportunity_id,
      sample_size,
      outcome_score,
      confidence,
      status,
      source_window_start,
      source_window_end,
      snapshot_date
    )
    select
      opportunity_id,
      sample_size,
      outcome_score,
      confidence,
      status,
      v_start,
      v_now,
      v_snapshot_date
    from aggregated
    on conflict (opportunity_id, snapshot_date) do update set
      sample_size = excluded.sample_size,
      outcome_score = excluded.outcome_score,
      confidence = excluded.confidence,
      status = excluded.status,
      source_window_start = excluded.source_window_start,
      source_window_end = excluded.source_window_end,
      created_at = now()
    returning 1
  )
  select count(*) into v_rows from upserted;

  return v_rows;
end;
$$;

revoke all on function public.refresh_opportunity_learning_snapshots(integer) from public, anon, authenticated;
grant execute on function public.refresh_opportunity_learning_snapshots(integer) to service_role;

do $$
declare
  v_job_id bigint;
begin
  for v_job_id in select jobid from cron.job where jobname = 'opportunity-learning-daily' loop
    perform cron.unschedule(v_job_id);
  end loop;
  perform cron.schedule(
    'opportunity-learning-daily',
    '17 3 * * *',
    'select public.refresh_opportunity_learning_snapshots(30);'
  );
end;
$$;
