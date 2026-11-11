begin;

do $$
begin
  if to_regprocedure('public.get_owner_privacy_safe_analytics(text,integer)') is null then
    raise exception 'public.get_owner_privacy_safe_analytics(text,integer) is missing; inspect the analytics deployment before changing privileges';
  end if;
end
$$;

revoke all on function public.get_owner_privacy_safe_analytics(text,integer)
  from public, anon, authenticated;
grant execute on function public.get_owner_privacy_safe_analytics(text,integer)
  to service_role;

comment on function public.get_owner_privacy_safe_analytics(text,integer) is
  'Legacy aggregate owner report. Server-side service access only; the protected operations API is the supported Control Centre path.';

commit;
