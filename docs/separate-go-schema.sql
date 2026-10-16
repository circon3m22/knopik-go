
create table public.knopik_go_saves (
 user_id uuid primary key references auth.users(id) on delete cascade,
 save jsonb not null default '{}'::jsonb check (jsonb_typeof(save)='object'),
 revision bigint not null default 0,
 source_id text,
 updated_at timestamptz not null default now()
);
create table public.knopik_go_config (
 id boolean primary key default true check(id=true),
 difficulty smallint not null default 50 check(difficulty between 0 and 100),
 updated_by uuid references public.profiles(id) on delete set null,
 updated_at timestamptz not null default now()
);
create table public.knopik_go_promo_codes (
 id uuid primary key default gen_random_uuid(),
 code text not null unique check(code ~ '^[A-Z0-9_-]{3,32}$'),
 amount integer not null check(amount between 1 and 1000000000),
 created_by uuid not null references public.profiles(id) on delete restrict,
 created_at timestamptz not null default now(),
 redeemed_by uuid references public.profiles(id) on delete set null,
 redeemed_at timestamptz,
 check ((redeemed_by is null and redeemed_at is null) or (redeemed_by is not null and redeemed_at is not null))
);
alter table public.knopik_go_saves enable row level security;
alter table public.knopik_go_config enable row level security;
alter table public.knopik_go_promo_codes enable row level security;
revoke all on public.knopik_go_saves,public.knopik_go_config,public.knopik_go_promo_codes from anon,authenticated;
grant select,insert,update on public.knopik_go_saves to authenticated;
grant select,update on public.knopik_go_config to authenticated;
grant select,insert on public.knopik_go_promo_codes to authenticated;
create policy go_save_read on public.knopik_go_saves for select to authenticated using ((select auth.uid())=user_id);
create policy go_save_insert on public.knopik_go_saves for insert to authenticated with check ((select auth.uid())=user_id);
create policy go_save_update on public.knopik_go_saves for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy go_save_admin_read on public.knopik_go_saves for select to authenticated using (exists(select 1 from public.profiles where id=(select auth.uid()) and is_admin));
create policy go_save_admin_update on public.knopik_go_saves for update to authenticated using (exists(select 1 from public.profiles where id=(select auth.uid()) and is_admin)) with check(exists(select 1 from public.profiles where id=(select auth.uid()) and is_admin));
create policy go_config_read on public.knopik_go_config for select to authenticated using(id=true);
create policy go_config_admin_update on public.knopik_go_config for update to authenticated using(id=true and exists(select 1 from public.profiles where id=(select auth.uid()) and is_admin)) with check(id=true and difficulty between 0 and 100 and updated_by=(select auth.uid()) and exists(select 1 from public.profiles where id=(select auth.uid()) and is_admin));
create policy go_promo_admin_read on public.knopik_go_promo_codes for select to authenticated using(exists(select 1 from public.profiles where id=(select auth.uid()) and is_admin));
create policy go_promo_admin_insert on public.knopik_go_promo_codes for insert to authenticated with check(created_by=(select auth.uid()) and redeemed_by is null and redeemed_at is null and exists(select 1 from public.profiles where id=(select auth.uid()) and is_admin));
insert into public.knopik_go_config(id,difficulty,updated_by,updated_at) select id,difficulty,updated_by,updated_at from public.game_config;
insert into public.knopik_go_config(id) values(true) on conflict(id) do nothing;
CREATE OR REPLACE FUNCTION private.redeem_knopik_go_promo_code(promo_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  caller_id uuid := auth.uid();
  normalized_code text := upper(trim(promo_code));
  selected_code public.knopik_go_promo_codes%rowtype;
  current_save jsonb;
  current_wallet bigint := 0;
  next_wallet bigint;
  next_save jsonb;
begin
  if caller_id is null then
    raise exception using errcode = '28000', message = 'Сначала войди в аккаунт.';
  end if;

  if normalized_code !~ '^[A-Z0-9_-]{3,32}$' then
    raise exception using errcode = '22023', message = 'Проверь формат промокода.';
  end if;

  if exists (
    select 1
    from public.profiles
    where id = caller_id and is_admin = true
  ) then
    raise exception using errcode = '42501', message = 'Промокоды предназначены для другого игрока.';
  end if;

  select *
  into selected_code
  from public.knopik_go_promo_codes
  where code = normalized_code
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Промокод не найден.';
  end if;

  if selected_code.redeemed_by is not null then
    raise exception using errcode = '23505', message = 'Этот промокод уже использован.';
  end if;

  select save
  into current_save
  from public.knopik_go_saves
  where user_id = caller_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Сохранение игрока не найдено.';
  end if;

  begin
    current_wallet := least(9007199254740991::bigint, greatest(0, coalesce((current_save ->> 'walletCoins')::bigint, 0)));
  exception when invalid_text_representation or numeric_value_out_of_range then
    current_wallet := 0;
  end;

  next_wallet := least(9007199254740991::bigint, current_wallet + selected_code.amount);
  next_save := jsonb_set(current_save, '{walletCoins}', to_jsonb(next_wallet), true);

  update public.knopik_go_saves
  set save = next_save,
      revision = revision + 1,
      source_id = 'promo:' || selected_code.id::text,
      updated_at = now()
  where user_id = caller_id;

  update public.knopik_go_promo_codes
  set redeemed_by = caller_id,
      redeemed_at = now()
  where id = selected_code.id;

  return jsonb_build_object(
    'amount', selected_code.amount,
    'save', next_save
  );
end;
$function$
;
create function public.redeem_knopik_go_promo_code(promo_code text) returns jsonb language sql security invoker set search_path=''
begin atomic
  select private.redeem_knopik_go_promo_code(promo_code);
end;
revoke all on function public.redeem_knopik_go_promo_code(text) from public,anon;
revoke all on function private.redeem_knopik_go_promo_code(text) from public,anon;
grant usage on schema private to authenticated;
grant execute on function public.redeem_knopik_go_promo_code(text) to authenticated;
grant execute on function private.redeem_knopik_go_promo_code(text) to authenticated;

