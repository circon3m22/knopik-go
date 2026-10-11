create table public.knopik_go_daily_cases (
  user_id uuid primary key references auth.users(id) on delete cascade,
  claimed_at timestamptz
);
alter table public.knopik_go_daily_cases enable row level security;
revoke all on public.knopik_go_daily_cases from anon, authenticated;
grant select on public.knopik_go_daily_cases to authenticated;
create policy go_daily_case_read on public.knopik_go_daily_cases
for select to authenticated using ((select auth.uid()) = user_id);

create function private.knopik_go_daily_case(p_claim boolean)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  caller uuid := auth.uid();
  server_time timestamptz := clock_timestamp();
  last_claim timestamptz;
  next_time timestamptz;
  current_save jsonb;
  current_cases integer;
  did_claim boolean := false;
begin
  if caller is null then
    raise exception using errcode = '28000', message = 'Сначала войди в аккаунт.';
  end if;
  if p_claim then
    insert into public.knopik_go_daily_cases(user_id) values(caller) on conflict(user_id) do nothing;
    select claimed_at into last_claim from public.knopik_go_daily_cases where user_id = caller for update;
    server_time := clock_timestamp();
    select save into current_save from public.knopik_go_saves where user_id = caller for update;
    if current_save is null then
      raise exception using errcode = 'P0001', message = 'Сначала сохрани прогресс игры.';
    end if;
    if last_claim is null or last_claim + interval '24 hours' <= server_time then
      current_cases := least(99, greatest(0, coalesce((current_save->>'commonCases')::integer, 0)));
      if current_cases >= 99 then
        raise exception using errcode = 'P0001', message = 'Сначала открой один обычный кейс.';
      end if;
      current_save := jsonb_set(current_save, '{commonCases}', to_jsonb(current_cases + 1), true);
      update public.knopik_go_saves set save = current_save, revision = revision + 1, updated_at = server_time where user_id = caller;
      update public.knopik_go_daily_cases set claimed_at = server_time where user_id = caller;
      last_claim := server_time;
      did_claim := true;
    end if;
  else
    select claimed_at into last_claim from public.knopik_go_daily_cases where user_id = caller;
  end if;
  next_time := case when last_claim is null then server_time else last_claim + interval '24 hours' end;
  return jsonb_build_object('server_now', server_time, 'next_available_at', next_time, 'claimed', did_claim,
    'common_cases', case when current_save is null then null else current_save->'commonCases' end,
    'save', case when did_claim then current_save else null end);
end;
$function$;
revoke all on function private.knopik_go_daily_case(boolean) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.knopik_go_daily_case(boolean) to authenticated;

create function public.get_knopik_go_daily_case()
returns jsonb language sql security invoker set search_path = ''
as $function$ select private.knopik_go_daily_case(false); $function$;
create function public.claim_knopik_go_daily_case()
returns jsonb language sql security invoker set search_path = ''
as $function$ select private.knopik_go_daily_case(true); $function$;
revoke all on function public.get_knopik_go_daily_case() from public, anon;
revoke all on function public.claim_knopik_go_daily_case() from public, anon;
grant execute on function public.get_knopik_go_daily_case(), public.claim_knopik_go_daily_case() to authenticated;
