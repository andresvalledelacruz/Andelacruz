-- Consolidación 2026-09-22: deja una única RPC de interacción (4 argumentos)
-- y rota la clave privada del panel sin guardar el secreto en el repositorio.

drop function if exists public.record_privacy_safe_interaction(text,text,text);

do $rotate$
declare
  v_signature regprocedure := 'public.get_owner_privacy_safe_analytics(text,integer)'::regprocedure;
  v_definition text;
  v_rotated text;
begin
  select pg_get_functiondef(v_signature) into v_definition;
  v_rotated := regexp_replace(
    v_definition,
    'v_expected constant text := ''[a-f0-9]{64}''',
    'v_expected constant text := ''8b6033024c1345a3aab2fb8ebc780bd5a7fcd5ea06d36d8d8ed884cdbe291109'''
  );
  if v_rotated = v_definition then
    raise exception 'owner analytics hash marker not found';
  end if;
  execute v_rotated;
end
$rotate$;
