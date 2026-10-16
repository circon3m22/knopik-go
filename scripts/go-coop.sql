-- Two authenticated GO players; no changes to personal saves, rewards, or TAP.
create table if not exists public.knopik_go_coop_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$'),
  host_id uuid not null references auth.users(id) on delete cascade,
  guest_id uuid references auth.users(id) on delete set null,
  host_name text not null,
  guest_name text,
  host_ready boolean not null default false,
  guest_ready boolean not null default false,
  status text not null default 'waiting' check (status in ('waiting','playing','closed')),
  seed integer not null check (seed > 0),
  round integer not null default 0 check (round >= 0),
  host_token uuid not null,
  guest_token uuid,
  host_seen timestamptz not null default now(),
  guest_seen timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours'),
  check (guest_id is null or guest_id <> host_id)
);
create index if not exists knopik_go_coop_rooms_host on public.knopik_go_coop_rooms(host_id);
create index if not exists knopik_go_coop_rooms_guest on public.knopik_go_coop_rooms(guest_id) where guest_id is not null;
alter table public.knopik_go_coop_rooms enable row level security;
revoke all on public.knopik_go_coop_rooms from anon, authenticated;
-- Tokens are for session ownership, and must never be returned by ordinary SELECT.
grant select (id, code, host_id, guest_id, host_name, guest_name, host_ready, guest_ready, status, seed, round, expires_at) on public.knopik_go_coop_rooms to authenticated;
create policy go_coop_participants on public.knopik_go_coop_rooms for select to authenticated
using ((select auth.uid()) in (host_id,guest_id) and expires_at > now());

-- Privileged admission is deliberately kept outside the exposed public schema.
create or replace function private.knopik_go_coop_command(p_action text, p_code text, p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  r public.knopik_go_coop_rooms%rowtype;
  player_name text;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
  host boolean;
  attempt integer;
begin
  perform private.require_knopik_go_access();
  if uid is null or p_token is null then raise exception using errcode='42501', message='Войди в аккаунт GO заново.'; end if;
  -- Serializes creates/joins for an account, including concurrent tabs.
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 9173));
  select username into player_name from public.profiles where id=uid;
  if player_name is null then raise exception 'Не найден профиль игрока.'; end if;
  if p_action='create' then
    if exists(select 1 from public.knopik_go_coop_rooms where status<>'closed' and expires_at>now() and ((host_id=uid and host_token<>p_token and host_seen>now()-interval '15 seconds') or (guest_id=uid and guest_token<>p_token and guest_seen>now()-interval '15 seconds'))) then
      raise exception 'Комната уже открыта на другом устройстве. Сначала выйди из неё.';
    end if;
    update public.knopik_go_coop_rooms set status='closed' where status<>'closed' and (host_id=uid or guest_id=uid);
    -- Delete only expired multiplayer rooms, never player progress.
    delete from public.knopik_go_coop_rooms where expires_at<now()-interval '1 day';
    for attempt in 1..8 loop
      new_code := '';
      for i in 1..6 loop new_code := new_code || substr(alphabet, 1+floor(random()*length(alphabet))::integer, 1); end loop;
      begin
        insert into public.knopik_go_coop_rooms(code,host_id,host_name,host_token,seed)
        values(new_code,uid,left(player_name,32),p_token,1+floor(random()*2147483646)::integer) returning * into r;
        exit;
      exception when unique_violation then
        if attempt=8 then raise exception 'Не удалось создать код комнаты. Повтори.'; end if;
      end;
    end loop;
  else
    select * into r from public.knopik_go_coop_rooms where code=upper(regexp_replace(p_code,'[\s-]','','g')) for update;
    if not found or r.expires_at<=now() then raise exception 'Комната не найдена или срок приглашения истёк.'; end if;
    if r.status='closed' then raise exception 'Комната закрыта. Создай новую.'; end if;
    host := uid=r.host_id;
    if p_action='join' then
      if host then
        if r.host_token<>p_token and r.host_seen>now()-interval '15 seconds' then raise exception 'Твоя комната уже открыта на другом устройстве.'; end if;
        r.host_token=p_token;r.host_seen=now();
      elsif uid=r.guest_id then
        if r.guest_token<>p_token and r.guest_seen>now()-interval '15 seconds' then raise exception 'Ты уже играешь с другого устройства.'; end if;
        r.guest_token=p_token;r.guest_seen=now();
      elsif r.guest_id is null and r.status='waiting' then
        if exists(select 1 from public.knopik_go_coop_rooms where id<>r.id and status<>'closed' and expires_at>now() and ((host_id=uid and host_seen>now()-interval '15 seconds') or (guest_id=uid and guest_seen>now()-interval '15 seconds'))) then raise exception 'Сначала выйди из другой комнаты.'; end if;
        r.guest_id=uid;r.guest_name=left(player_name,32);r.guest_token=p_token;r.guest_seen=now();r.host_ready=false;r.guest_ready=false;
      else raise exception 'В комнате уже два игрока.';
      end if;
    else
      if not (host and r.host_token=p_token or uid=r.guest_id and r.guest_token=p_token) then raise exception using errcode='42501',message='Комната открыта в другой вкладке. Подключись заново.'; end if;
      if p_action='heartbeat' then
        if host then r.host_seen=now();else r.guest_seen=now();end if;
      elsif p_action='ready' then
        if r.status<>'waiting' then raise exception 'Игра уже началась.'; end if;
        if host then r.host_ready=not r.host_ready;else r.guest_ready=not r.guest_ready;end if;
      elsif p_action='start' then
        if not host or r.status<>'waiting' or r.guest_id is null or not r.host_ready or not r.guest_ready or r.guest_seen<now()-interval '15 seconds' then raise exception 'Дождись готовности и подключения обоих игроков.'; end if;
        r.status='playing';r.round=r.round+1;
      elsif p_action='lobby' then
        if not host then raise exception 'Вернуться в комнату может ведущий.'; end if;
        r.status='waiting';r.host_ready=false;r.guest_ready=false;r.seed=1+floor(random()*2147483646)::integer;
      elsif p_action='leave' then
        if host or r.status='playing' then r.status='closed';
        else r.guest_id=null;r.guest_name=null;r.guest_token=null;r.guest_seen=null;r.host_ready=false;r.guest_ready=false;end if;
      else raise exception 'Неизвестное действие комнаты.';
      end if;
    end if;
    update public.knopik_go_coop_rooms set guest_id=r.guest_id,guest_name=r.guest_name,host_ready=r.host_ready,guest_ready=r.guest_ready,status=r.status,seed=r.seed,round=r.round,host_token=r.host_token,guest_token=r.guest_token,host_seen=r.host_seen,guest_seen=r.guest_seen where id=r.id;
  end if;
  return to_jsonb(r)-array['host_token','guest_token','host_seen','guest_seen','created_at'];
end;
$$;
revoke all on function private.knopik_go_coop_command(text,text,uuid) from public,anon;
grant execute on function private.knopik_go_coop_command(text,text,uuid) to authenticated;
-- SQL-standard body is bound at creation time. The browser needs EXECUTE on
-- this narrow entry point, without receiving USAGE on the private schema.
-- Authorization and the privileged, atomic admission stay in the private helper.
create or replace function public.knopik_go_coop_command(p_action text, p_code text, p_token uuid)
returns jsonb language sql security invoker set search_path = ''
begin atomic
  select private.knopik_go_coop_command(p_action,p_code,p_token);
end;
revoke all on function public.knopik_go_coop_command(text,text,uuid) from public,anon;
grant execute on function public.knopik_go_coop_command(text,text,uuid) to authenticated;

-- Both peers receive both topics. Only the host can publish host state;
-- only the admitted guest can publish guest input. No third account can join.
create policy go_coop_receive on realtime.messages for select to authenticated using (
  extension in ('broadcast','presence') and exists (
    select 1 from public.knopik_go_coop_rooms r where r.status<>'closed' and r.expires_at>now()
      and (select auth.uid()) in (r.host_id,r.guest_id)
      and (select realtime.topic()) in ('go-coop:'||r.id::text||':host','go-coop:'||r.id::text||':guest')
  )
);
create policy go_coop_send on realtime.messages for insert to authenticated with check (
  extension in ('broadcast','presence') and exists (
    select 1 from public.knopik_go_coop_rooms r where r.status<>'closed' and r.expires_at>now()
      and ((r.host_id=(select auth.uid()) and (select realtime.topic())='go-coop:'||r.id::text||':host')
        or (r.guest_id=(select auth.uid()) and (select realtime.topic())='go-coop:'||r.id::text||':guest'))
  )
);
