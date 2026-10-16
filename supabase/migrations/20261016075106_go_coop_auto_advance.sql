-- One atomic, host-owned transition. A retried request cannot skip a level.
create or replace function private.knopik_go_coop_advance(p_code text,p_token uuid,p_round integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid();r public.knopik_go_coop_rooms%rowtype;
begin
 perform private.require_knopik_go_access();
 if uid is null or p_token is null then raise exception using errcode='42501',message='Войди в аккаунт GO заново.';end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,9173));
 select * into r from public.knopik_go_coop_rooms where code=upper(regexp_replace(p_code,'[\s-]','','g')) for update;
 if not found or r.expires_at<=now() or r.status='closed' then raise exception 'Комната не найдена или закрыта.';end if;
 if uid<>r.host_id or r.host_token<>p_token then raise exception using errcode='42501',message='Перейти дальше может ведущий на своём устройстве.';end if;
 if p_round is null or p_round<1 or p_round>r.round then raise exception 'Неверный номер вылазки.';end if;
 if p_round=r.round then
  if r.status<>'playing' then raise exception 'Вылазка уже закончилась. Выбери маршрут в комнате.';end if;
  if r.guest_id is null or r.guest_seen is null or r.guest_seen<now()-interval '15 seconds' then raise exception 'Ждём подключения напарника, чтобы перейти вместе.';end if;
  if r.host_protocol<>3 or r.guest_protocol<>3 then raise exception 'Обновите игру на обоих устройствах.';end if;
  if r.mode='campaign' and r.level_id=25 then r.mode:='abyss';r.level_id:=1;
  elsif r.level_id<9999 then r.level_id:=r.level_id+1;
  else raise exception 'Последний доступный этаж пройден. Выбери другой маршрут в комнате.';end if;
  r.round:=r.round+1;r.seed:=1+floor(random()*2147483646)::integer;r.host_seen:=now();
  update public.knopik_go_coop_rooms set mode=r.mode,level_id=r.level_id,round=r.round,seed=r.seed,host_seen=r.host_seen where id=r.id;
 end if;
 return to_jsonb(r)-array['host_token','guest_token','host_seen','guest_seen','created_at'];
end;$$;
revoke all on function private.knopik_go_coop_advance(text,uuid,integer) from public,anon;
grant execute on function private.knopik_go_coop_advance(text,uuid,integer) to authenticated;

create or replace function public.knopik_go_coop_advance(p_code text,p_token uuid,p_round integer)
returns jsonb language sql security invoker set search_path=''
begin atomic
 select private.knopik_go_coop_advance(p_code,p_token,p_round);
end;
revoke all on function public.knopik_go_coop_advance(text,uuid,integer) from public,anon;
grant execute on function public.knopik_go_coop_advance(text,uuid,integer) to authenticated;
