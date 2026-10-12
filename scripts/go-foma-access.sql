do $go_access$
declare
  foma_id uuid;
  table_name text;
  function_definition text;
  protected_function record;
begin
  if (select count(*) from public.profiles where lower(username) = 'foma') <> 1 then
    raise exception 'Expected exactly one Foma profile';
  end if;
  select id into strict foma_id from public.profiles where lower(username) = 'foma';

  execute format($helper$
    create or replace function private.require_knopik_go_access()
    returns void language plpgsql security invoker set search_path = ''
    as $body$
    begin
      if auth.uid() is distinct from %L::uuid then
        raise exception using errcode = '42501', message = 'Knopik GO доступен только Фоме.';
      end if;
    end;
    $body$;
  $helper$, foma_id);
  revoke all on function private.require_knopik_go_access() from public, anon;
  grant execute on function private.require_knopik_go_access() to authenticated;

  foreach table_name in array array['knopik_go_saves','knopik_go_config','knopik_go_promo_codes','knopik_go_daily_cases'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy go_foma_only on public.%I as restrictive for all to authenticated using ((select auth.uid()) = %L::uuid) with check ((select auth.uid()) = %L::uuid)', table_name, foma_id, foma_id);
  end loop;

  if (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'private' and p.proname in ('redeem_knopik_go_promo_code','knopik_go_daily_case')) <> 2 then
    raise exception 'Expected the two GO reward functions';
  end if;
  for protected_function in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname in ('redeem_knopik_go_promo_code','knopik_go_daily_case')
  loop
    function_definition := pg_get_functiondef(protected_function.oid);
    if position('private.require_knopik_go_access()' in function_definition) = 0 then
      function_definition := regexp_replace(function_definition, E'\\mbegin\\M', E'begin\n  perform private.require_knopik_go_access();', 'i');
      if position('private.require_knopik_go_access()' in function_definition) = 0 then
        raise exception 'Could not protect GO reward function';
      end if;
      execute function_definition;
    end if;
  end loop;
end;
$go_access$;
