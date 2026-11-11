begin;

do $$
declare
  v_function regprocedure := to_regprocedure(
    'public.get_runtime_partner_offers_v2(text[],text,integer)'
  );
begin
  -- The legacy commercial schema predates the repository migration chain.
  -- Fresh installations without this dormant RPC are already closed.
  if v_function is null then
    return;
  end if;

  execute format(
    'revoke all on function %s from public, anon, authenticated',
    v_function
  );
  execute format(
    'grant execute on function %s to service_role',
    v_function
  );
  execute format(
    'comment on function %s is %L',
    v_function,
    'Dormant partner-offer reader. Server-side service access only until approved partners, surfaces and a reviewed runtime consumer exist.'
  );
end
$$;

commit;
