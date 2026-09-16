do $rotate$
declare
  v_signature regprocedure := 'public.get_owner_privacy_safe_analytics(text,integer)'::regprocedure;
  v_definition text;
  v_rotated text;
  v_old_hash constant text := '36704f98532cfa80c93aafeea409c0ad1732c7a6ed10eb0dd9baad39b2471c19';
  v_new_hash constant text := '3efc4574a313fcd3f3a12e5e7d85a580e27180b8ee058ae098097d9555f58e0a';
begin
  select pg_get_functiondef(v_signature) into v_definition;
  if position(v_old_hash in v_definition) = 0 then
    raise exception 'expected owner analytics hash not found';
  end if;
  v_rotated := replace(v_definition, v_old_hash, v_new_hash);
  execute v_rotated;
end
$rotate$;
