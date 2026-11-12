begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
declare
  v_keep record;
  v_duplicate record;
begin
  select i.*, c.relam, c.reloptions::text as reloptions
    into v_keep
  from pg_catalog.pg_index i
  join pg_catalog.pg_class c on c.oid = i.indexrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'opportunity_learning_snapshots_latest_idx';

  select i.*, c.relam, c.reloptions::text as reloptions
    into v_duplicate
  from pg_catalog.pg_index i
  join pg_catalog.pg_class c on c.oid = i.indexrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'opportunity_learning_snapshots_opportunity_created_idx';

  -- Fresh installations do not necessarily contain the legacy duplicate.
  if v_duplicate.indexrelid is null then
    return;
  end if;

  -- Never remove the only surviving index if the expected retained copy is absent.
  if v_keep.indexrelid is null then
    raise exception 'retained opportunity learning index is missing';
  end if;

  if row(
    v_keep.indrelid,
    v_keep.indnatts,
    v_keep.indnkeyatts,
    v_keep.indisunique,
    v_keep.indisprimary,
    v_keep.indisexclusion,
    v_keep.indimmediate,
    v_keep.indkey::text,
    v_keep.indcollation::text,
    v_keep.indclass::text,
    v_keep.indoption::text,
    coalesce(v_keep.indexprs::text, ''),
    coalesce(v_keep.indpred::text, ''),
    v_keep.relam,
    coalesce(v_keep.reloptions, '')
  ) is distinct from row(
    v_duplicate.indrelid,
    v_duplicate.indnatts,
    v_duplicate.indnkeyatts,
    v_duplicate.indisunique,
    v_duplicate.indisprimary,
    v_duplicate.indisexclusion,
    v_duplicate.indimmediate,
    v_duplicate.indkey::text,
    v_duplicate.indcollation::text,
    v_duplicate.indclass::text,
    v_duplicate.indoption::text,
    coalesce(v_duplicate.indexprs::text, ''),
    coalesce(v_duplicate.indpred::text, ''),
    v_duplicate.relam,
    coalesce(v_duplicate.reloptions, '')
  ) then
    raise exception 'opportunity learning indexes are no longer identical';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_constraint
    where conindid = v_duplicate.indexrelid
  ) then
    raise exception 'duplicate opportunity learning index backs a constraint';
  end if;

  execute 'drop index public.opportunity_learning_snapshots_opportunity_created_idx';
end
$$;

commit;
