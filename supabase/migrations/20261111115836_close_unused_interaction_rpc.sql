begin;

do $$
declare
  v_function regprocedure := to_regprocedure(
    'public.record_privacy_safe_interaction(text,text,text,text)'
  );
begin
  -- This legacy RPC was deployed before the repository migration history was
  -- complete. Fresh installations may therefore have no function to close.
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
    'Legacy aggregate interaction writer. No current runtime consumer; server-side service access only pending a reviewed replacement.'
  );
end
$$;

commit;
