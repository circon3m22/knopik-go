-- Protocol 3 carries the selected Shiba skin independently for both players.
create or replace function private.knopik_go_coop_setup(p_code text,p_token uuid,p_mode text,p_level integer,p_equipment jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid();r public.knopik_go_coop_rooms%rowtype;host boolean;gear jsonb;changed boolean;
begin
 perform private.require_knopik_go_access();
 if uid is null or p_token is null then raise exception using errcode='42501',message='Войди в аккаунт GO заново.';end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,9173));
 select * into r from public.knopik_go_coop_rooms where code=upper(regexp_replace(p_code,'[\s-]','','g')) for update;
 if not found or r.expires_at<=now() or r.status='closed' then raise exception 'Комната не найдена или закрыта.';end if;
 host:=uid=r.host_id;
 if not coalesce((host and r.host_token=p_token or uid=r.guest_id and r.guest_token=p_token),false) then raise exception using errcode='42501',message='Комната открыта в другой вкладке. Подключись заново.';end if;
 if r.status<>'waiting' then raise exception 'Экипировка и маршрут меняются перед вылазкой.';end if;
 if jsonb_typeof(p_equipment->'hat') is distinct from 'boolean' or jsonb_typeof(p_equipment->'mohawk') is distinct from 'boolean' or not(p_equipment ? 'accessory') or not(p_equipment->'accessory'='null'::jsonb or p_equipment->>'accessory' in ('bandana','charm','goggles','cape')) then raise exception 'Неверная экипировка.';end if;
 if p_equipment ? 'skin' and (jsonb_typeof(p_equipment->'skin') is distinct from 'string' or p_equipment->>'skin' not in ('classic','shiba-white','shiba-black')) then raise exception 'Неверный скин.';end if;
 gear:=jsonb_build_object('skin',coalesce(p_equipment->>'skin','classic'),'hat',p_equipment->'hat','mohawk',p_equipment->'mohawk','accessory',p_equipment->'accessory');
 if p_mode is not null or p_level is not null then
  if not host then raise exception 'Маршрут выбирает ведущий.';end if;
  if p_mode is null or p_mode not in ('campaign','arcade','abyss') or p_level is null or p_level<1 or p_level>(case when p_mode='campaign' then 25 else 9999 end) then raise exception 'Неверный уровень.';end if;
  changed:=r.mode<>p_mode or r.level_id<>p_level;r.mode:=p_mode;r.level_id:=p_level;
 else changed:=false;end if;
 if host then changed:=changed or r.host_equipment<>gear or r.host_protocol<>3;r.host_equipment:=gear;r.host_protocol:=3;r.host_seen:=now();
 else changed:=changed or r.guest_equipment<>gear or r.guest_protocol<>3;r.guest_equipment:=gear;r.guest_protocol:=3;r.guest_seen:=now();end if;
 if changed then r.host_ready:=false;r.guest_ready:=false;end if;
 update public.knopik_go_coop_rooms set mode=r.mode,level_id=r.level_id,host_equipment=r.host_equipment,guest_equipment=r.guest_equipment,host_protocol=r.host_protocol,guest_protocol=r.guest_protocol,host_ready=r.host_ready,guest_ready=r.guest_ready,host_seen=r.host_seen,guest_seen=r.guest_seen where id=r.id;
 return to_jsonb(r)-array['host_token','guest_token','host_seen','guest_seen','created_at'];
end;$$;
revoke all on function private.knopik_go_coop_setup(text,uuid,text,integer,jsonb) from public,anon;
grant execute on function private.knopik_go_coop_setup(text,uuid,text,integer,jsonb) to authenticated;
create or replace function public.knopik_go_coop_setup(p_code text,p_token uuid,p_mode text,p_level integer,p_equipment jsonb)
returns jsonb language sql security invoker set search_path=''
begin atomic
 select private.knopik_go_coop_setup(p_code,p_token,p_mode,p_level,p_equipment);
end;
revoke all on function public.knopik_go_coop_setup(text,uuid,text,integer,jsonb) from public,anon;
grant execute on function public.knopik_go_coop_setup(text,uuid,text,integer,jsonb) to authenticated;

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
        r.guest_protocol=0;r.guest_equipment='{"hat":false,"mohawk":false,"accessory":null}'::jsonb;r.guest_id=uid;r.guest_name=left(player_name,32);r.guest_token=p_token;r.guest_seen=now();r.host_ready=false;r.guest_ready=false;
      else raise exception 'В комнате уже два игрока.';
      end if;
    else
      if not coalesce((host and r.host_token=p_token or uid=r.guest_id and r.guest_token=p_token),false) then raise exception using errcode='42501',message='Комната открыта в другой вкладке. Подключись заново.'; end if;
      if p_action='heartbeat' then
        if host then r.host_seen=now();else r.guest_seen=now();end if;
      elsif p_action='ready' then
        if r.status<>'waiting' then raise exception 'Игра уже началась.'; end if;
        if (host and r.host_protocol<>3) or (not host and r.guest_protocol<>3) then raise exception 'Обнови игру, чтобы выбрать маршрут и экипировку.';end if;
        if host then r.host_ready=not r.host_ready;else r.guest_ready=not r.guest_ready;end if;
      elsif p_action='start' then
        if r.host_protocol<>3 or r.guest_protocol<>3 then raise exception 'Обновите игру на обоих устройствах.';end if;
        if not host or r.status<>'waiting' or r.guest_id is null or not r.host_ready or not r.guest_ready or r.guest_seen<now()-interval '15 seconds' then raise exception 'Дождись готовности и подключения обоих игроков.'; end if;
        r.status='playing';r.round=r.round+1;
      elsif p_action='lobby' then
        if not host then raise exception 'Вернуться в комнату может ведущий.'; end if;
        r.status='waiting';r.host_ready=false;r.guest_ready=false;r.seed=1+floor(random()*2147483646)::integer;
      elsif p_action='leave' then
        if host or r.status='playing' then r.status='closed';
        else r.guest_protocol=0;r.guest_equipment='{"hat":false,"mohawk":false,"accessory":null}'::jsonb;r.guest_id=null;r.guest_name=null;r.guest_token=null;r.guest_seen=null;r.host_ready=false;r.guest_ready=false;end if;
      else raise exception 'Неизвестное действие комнаты.';
      end if;
    end if;
    update public.knopik_go_coop_rooms set guest_protocol=r.guest_protocol,guest_equipment=r.guest_equipment,guest_id=r.guest_id,guest_name=r.guest_name,host_ready=r.host_ready,guest_ready=r.guest_ready,status=r.status,seed=r.seed,round=r.round,host_token=r.host_token,guest_token=r.guest_token,host_seen=r.host_seen,guest_seen=r.guest_seen where id=r.id;
  end if;
  return to_jsonb(r)-array['host_token','guest_token','host_seen','guest_seen','created_at'];
end;
$$;
revoke all on function private.knopik_go_coop_command(text,text,uuid) from public,anon;
grant execute on function private.knopik_go_coop_command(text,text,uuid) to authenticated;
