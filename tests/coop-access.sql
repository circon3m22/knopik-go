-- Run as a database administrator. Every room and test message is rolled back.
begin;
create temp table coop_qa(room jsonb, check_name text) on commit drop;
grant all on coop_qa to authenticated;
-- Authorization probes need a live partition, independent of the test server clock.
create temp table coop_qa_partition on commit drop as
select max(((regexp_match(pg_get_expr(c.relpartbound,c.oid), $bound$FROM \('([^']+)'$bound$))[1])::timestamp)+interval '1 hour' as message_at
from pg_inherits i join pg_class c on c.oid=i.inhrelid where i.inhparent='realtime.messages'::regclass;
grant select on coop_qa_partition to authenticated;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"14b063d8-1790-451b-a354-1f7dcaa41f13","role":"authenticated"}',true);
insert into coop_qa(room,check_name) values(public.knopik_go_coop_command('create','', '10000000-0000-4000-8000-000000000001'),'host creates a room');
do $$
declare r jsonb := (select room from coop_qa limit 1);
begin
  if r->>'host_id'<>'14b063d8-1790-451b-a354-1f7dcaa41f13' or (r->>'code')!~'^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$' or r ? 'host_token' then raise exception 'Invalid room/credential disclosure'; end if;
  if has_column_privilege('authenticated','public.knopik_go_coop_rooms','host_token','select') then raise exception 'Session token exposed'; end if;
  begin
    perform public.knopik_go_coop_command('start',r->>'code','10000000-0000-4000-8000-000000000001');raise exception 'Early start was allowed';
  exception when raise_exception then if sqlerrm='Early start was allowed' then raise; end if; end;
  begin
    perform public.knopik_go_coop_command('join',r->>'code','20000000-0000-4000-8000-000000000001');raise exception 'Duplicate device admitted';
  exception when raise_exception then if sqlerrm='Duplicate device admitted' then raise; end if; end;
  if not exists(select 1 from public.knopik_go_coop_rooms where id=(r->>'id')::uuid) then raise exception 'Host cannot read room';end if;
  begin
    perform public.knopik_go_coop_command('ready',r->>'code','10000000-0000-4000-8000-000000000001');raise exception 'Old protocol can ready';
  exception when raise_exception then if sqlerrm='Old protocol can ready' then raise;end if;end;
  for i in 1..25 loop
    r:=public.knopik_go_coop_setup(r->>'code','10000000-0000-4000-8000-000000000001','campaign',i,'{"hat":true,"mohawk":false,"accessory":"bandana","skin":"shiba-white"}');
    if (r->>'level_id')::integer<>i then raise exception 'Cannot select campaign %',i;end if;
  end loop;
  if r ? 'host_token' or r->'host_equipment'->>'skin'<>'shiba-white' or (r->>'host_protocol')::integer<>3 or r->'host_equipment'->>'accessory'<>'bandana' then raise exception 'Setup privacy/loadout failed';end if;
  perform public.knopik_go_coop_command('ready',r->>'code','10000000-0000-4000-8000-000000000001');
  r:=public.knopik_go_coop_setup(r->>'code','10000000-0000-4000-8000-000000000001','abyss',5,'{"hat":true,"mohawk":false,"accessory":"bandana","skin":"shiba-white"}');
  if (r->>'host_ready')::boolean then raise exception 'Route change kept readiness';end if;

end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000099","role":"authenticated"}',true);
do $$
begin
  if exists(select 1 from public.knopik_go_coop_rooms where id=((select room from coop_qa limit 1)->>'id')::uuid) then raise exception 'Third player can read private room';end if;
  begin
    perform public.knopik_go_coop_command('join',(select room->>'code' from coop_qa limit 1),'30000000-0000-4000-8000-000000000001');raise exception 'Third player admitted';
  exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"f53a06e6-f782-4969-935a-124a0ea9abe5","role":"authenticated"}',true);
insert into coop_qa(room,check_name) select public.knopik_go_coop_command('join',room->>'code','10000000-0000-4000-8000-000000000002'),'guest joins by code' from coop_qa limit 1;
do $$
declare r jsonb := (select room from coop_qa where check_name='guest joins by code');
begin
  if r->>'guest_id'<>'f53a06e6-f782-4969-935a-124a0ea9abe5' then raise exception 'Guest did not claim the second seat';end if;
  begin
    update public.knopik_go_coop_rooms set host_ready=true where id=(r->>'id')::uuid;raise exception 'Direct room mutation allowed';
  exception when insufficient_privilege then null;end;
  begin
    perform public.knopik_go_coop_setup(r->>'code','10000000-0000-4000-8000-000000000002','campaign',2,'{"hat":false,"mohawk":false,"accessory":null}');raise exception 'Guest can change route';
  exception when raise_exception then if sqlerrm='Guest can change route' then raise;end if;end;
  begin
    perform public.knopik_go_coop_setup(r->>'code','10000000-0000-4000-8000-000000000002',null,null,'{"hat":false,"mohawk":false,"accessory":"invalid"}');raise exception 'Invalid outfit accepted';
  exception when raise_exception then if sqlerrm='Invalid outfit accepted' then raise;end if;end;
  r:=public.knopik_go_coop_setup(r->>'code','10000000-0000-4000-8000-000000000002',null,null,'{"hat":false,"mohawk":true,"accessory":"cape","skin":"shiba-black"}');
  if r->>'mode'<>'abyss' or (r->>'level_id')::integer<>5 or r->'host_equipment'->>'accessory'<>'bandana' or r->'guest_equipment'->>'accessory'<>'cape' or r->'host_equipment'->>'skin'<>'shiba-white' or r->'guest_equipment'->>'skin'<>'shiba-black' or (r->>'guest_protocol')::integer<>3 then raise exception 'Outfit sync damaged route/partner gear';end if;
  begin
    perform public.knopik_go_coop_setup(r->>'code','10000000-0000-4000-8000-000000000002',null,null,'{"hat":false,"mohawk":false,"accessory":null,"skin":"fake"}');raise exception 'Invalid skin accepted';
  exception when raise_exception then if sqlerrm='Invalid skin accepted' then raise;end if;end;
  perform public.knopik_go_coop_command('ready',r->>'code','10000000-0000-4000-8000-000000000002');
  perform set_config('realtime.topic','go-coop:'||(r->>'id')||':guest',true);
  insert into realtime.messages(topic,extension,payload,event,private,skip_broadcast,inserted_at) values('go-coop:'||(r->>'id')||':guest','broadcast','{}','coop-qa',true,true,(select message_at from coop_qa_partition));
  if not exists(select 1 from realtime.messages where event='coop-qa') then raise exception 'Guest cannot receive own room channel';end if;
  perform set_config('realtime.topic','go-coop:'||(r->>'id')||':host',true);
  begin
    insert into realtime.messages(topic,extension,payload,event,private,skip_broadcast,inserted_at) values('go-coop:'||(r->>'id')||':host','broadcast','{}','coop-qa-spoof',true,true,(select message_at from coop_qa_partition));raise exception 'Guest can impersonate host';
  exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"14b063d8-1790-451b-a354-1f7dcaa41f13","role":"authenticated"}',true);
do $$
declare r jsonb := (select room from coop_qa limit 1);started jsonb;
begin
  perform public.knopik_go_coop_command('ready',r->>'code','10000000-0000-4000-8000-000000000001');
  started := public.knopik_go_coop_command('start',r->>'code','10000000-0000-4000-8000-000000000001');
  begin
    perform public.knopik_go_coop_setup(r->>'code','10000000-0000-4000-8000-000000000001','campaign',25,'{"hat":false,"mohawk":false,"accessory":null}');raise exception 'Setup changed mid-battle';
  exception when raise_exception then if sqlerrm='Setup changed mid-battle' then raise;end if;end;
  if started->>'status'<>'playing' or (started->>'round')::integer<>1 then raise exception 'Ready room did not start';end if;
  perform set_config('realtime.topic','go-coop:'||(r->>'id')||':host',true);
  insert into realtime.messages(topic,extension,payload,event,private,skip_broadcast,inserted_at) values('go-coop:'||(r->>'id')||':host','broadcast','{}','coop-qa',true,true,(select message_at from coop_qa_partition));
  perform set_config('realtime.topic','go-coop:'||(r->>'id')||':guest',true);
  if not exists(select 1 from realtime.messages where event='coop-qa') then raise exception 'Host cannot receive guest input';end if;
  begin
    insert into realtime.messages(topic,extension,payload,event,private,skip_broadcast,inserted_at) values('go-coop:'||(r->>'id')||':guest','broadcast','{}','coop-qa-spoof',true,true,(select message_at from coop_qa_partition));raise exception 'Host can impersonate guest';
  exception when insufficient_privilege then null;end;
  perform public.knopik_go_coop_command('lobby',r->>'code','10000000-0000-4000-8000-000000000001');
end $$;
select set_config('request.jwt.claims','{"sub":"f53a06e6-f782-4969-935a-124a0ea9abe5","role":"authenticated"}',true);
do $$
declare r jsonb := (select room from coop_qa limit 1);left_room jsonb;
begin
  left_room:=public.knopik_go_coop_command('leave',r->>'code','10000000-0000-4000-8000-000000000002');
  begin
    perform public.knopik_go_coop_command('heartbeat',r->>'code','10000000-0000-4000-8000-000000000002');raise exception 'Former guest can mutate empty seat room';
  exception when insufficient_privilege then null;end;
  if left_room->>'guest_id' is not null or left_room->>'status'<>'waiting' then raise exception 'Waiting guest did not release seat';end if;
end $$;
select set_config('request.jwt.claims','{"sub":"14b063d8-1790-451b-a354-1f7dcaa41f13","role":"authenticated"}',true);
do $$
declare r jsonb := (select room from coop_qa limit 1);closed jsonb;
begin
  closed:=public.knopik_go_coop_command('leave',r->>'code','10000000-0000-4000-8000-000000000001');
  if closed->>'status'<>'closed' then raise exception 'Host exit did not close room';end if;
  if has_function_privilege('anon','public.knopik_go_coop_setup(text,uuid,text,integer,jsonb)','execute') then raise exception 'Anonymous setup RPC access';end if;
  if has_function_privilege('anon','public.knopik_go_coop_command(text,text,uuid)','execute') then raise exception 'Anonymous RPC access';end if;
end $$;
select 'PASS: independent white/black Shibas, invalid skin rejected, protocol3, all 25 campaign selections, Abyss, independent loadouts, host-only setup, protocol check, empty-seat authorization, readiness reset, admission, two seats, readiness, start/rematch/exit, duplicate devices, outsiders, token privacy, and role-separated Broadcast RLS' as result;
rollback;
