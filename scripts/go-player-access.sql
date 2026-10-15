-- Access only; never create/reset users or copy TAP/another player's progress.
-- UUIDs are resolved once from the existing verified profiles and embedded in
-- restrictive policies. User-editable metadata cannot grant game access.
do $go_players$
declare player_ids uuid[]; table_name text;
begin
  if (select count(*) from public.profiles where lower(username) in ('foma','proclick')) <> 2 then
    raise exception 'Expected exactly one Foma and one Proclick profile';
  end if;
  select array_agg(id order by id) into player_ids from public.profiles where lower(username) in ('foma','proclick');
  execute format($helper$
    create or replace function private.require_knopik_go_access()
    returns void language plpgsql security invoker set search_path = '' as $body$
    begin
      if auth.uid() is null or not (auth.uid() = any (%L::uuid[])) then
        raise exception using errcode = '42501', message = 'Нет доступа к Knopik GO.';
      end if;
    end;
    $body$;
  $helper$, player_ids);
  revoke all on function private.require_knopik_go_access() from public, anon;
  grant execute on function private.require_knopik_go_access() to authenticated;
  foreach table_name in array array['knopik_go_saves','knopik_go_config','knopik_go_promo_codes','knopik_go_daily_cases'] loop
    execute format('drop policy if exists go_foma_only on public.%I',table_name);
    execute format('drop policy if exists go_verified_players on public.%I',table_name);
    execute format('create policy go_verified_players on public.%I as restrictive for all to authenticated using ((select auth.uid()) = any (%L::uuid[])) with check ((select auth.uid()) = any (%L::uuid[]))',table_name,player_ids,player_ids);
  end loop;
end;
$go_players$;
