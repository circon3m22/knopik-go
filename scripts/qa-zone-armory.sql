-- Run as a single transaction. Synthetic rooms and all temporary save changes roll back.
begin;
do $$
<<qa>>
declare
 h uuid:='14b063d8-1790-451b-a354-1f7dcaa41f13';g uuid:='f53a06e6-f782-4969-935a-124a0ea9abe5';
 ht uuid:=gen_random_uuid();gt uuid:=gen_random_uuid();rid uuid;code text;r jsonb;retry jsonb;invalid jsonb;
 host_gear jsonb:='{"skin":"glacier","hat":false,"mohawk":true,"accessory":"hunter-cloak","weaponUpgrades":{"fist":1,"sabre":3,"rifle":1}}';
 guest_gear jsonb:='{"skin":"shiba-black","hat":true,"mohawk":false,"accessory":"raven-mask","weaponUpgrades":{"rifle":2}}';
 prior public.knopik_go_saves;written public.knopik_go_saves;returned public.knopik_go_saves;payload jsonb;format_version integer;
begin
 assert not has_function_privilege('anon','public.knopik_go_coop_setup(text,uuid,text,integer,jsonb)','EXECUTE');
 assert not has_function_privilege('authenticated','private.knopik_go_weapon_upgrades(jsonb)','EXECUTE');
 assert not (select prosecdef from pg_proc where oid='public.knopik_go_coop_setup(text,uuid,text,integer,jsonb)'::regprocedure);
 assert not (select prosecdef from pg_proc where oid='public.save_knopik_go_progress(jsonb,bigint,text)'::regprocedure);
 assert private.knopik_go_weapon_upgrades(null)='{}'::jsonb;
 assert private.knopik_go_weapon_upgrades('{"fist":0,"sabre":3,"rifle":2}'::jsonb)='{"fist":0,"sabre":3,"rifle":2}'::jsonb;
 for invalid in select unnest(array['[]'::jsonb,'null'::jsonb,'{"rifle":4}'::jsonb,'{"rifle":-1}'::jsonb,'{"rifle":1.5}'::jsonb,'{"rifle":"2"}'::jsonb,'{"fake":1}'::jsonb]) loop
  begin perform private.knopik_go_weapon_upgrades(invalid);raise exception 'QA: invalid upgrade accepted';exception when invalid_parameter_value then null;end;
 end loop;
 loop
  code:='QA';for i in 1..4 loop code:=code||substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',1+floor(random()*32)::integer,1);end loop;
  exit when not exists(select 1 from public.knopik_go_coop_rooms c where c.code=qa.code);
 end loop;
 insert into public.knopik_go_coop_rooms(code,host_id,guest_id,host_name,guest_name,host_token,guest_token,seed,round,status,host_ready,guest_ready,host_seen,guest_seen,mode,level_id,host_protocol,guest_protocol,host_equipment,guest_equipment)
 values(code,h,g,'QA host','QA guest',ht,gt,123,10,'waiting',false,false,now(),now(),'campaign',35,0,0,host_gear,guest_gear) returning id into rid;
 perform set_config('request.jwt.claim.sub',h::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',h,'role','authenticated')::text,true);
 execute 'set local role authenticated';
 r:=public.knopik_go_coop_setup(code,ht,'campaign',35,host_gear||'{"protocol":6}'::jsonb);
 assert (r->>'host_protocol')::integer=6 and r->'host_equipment'=host_gear;
 for invalid in select unnest(array['{"rifle":4}'::jsonb,'{"rifle":-1}'::jsonb,'{"rifle":"1"}'::jsonb,'{"fake":1}'::jsonb]) loop
  begin perform public.knopik_go_coop_setup(code,ht,null,null,(host_gear||'{"protocol":6}'::jsonb)||jsonb_build_object('weaponUpgrades',invalid));raise exception 'QA: setup accepted invalid perks';exception when invalid_parameter_value then null;end;
 end loop;
 begin perform public.knopik_go_coop_setup(code,gt,null,null,host_gear||'{"protocol":6}'::jsonb);raise exception 'QA: wrong token accepted';exception when insufficient_privilege then null;end;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',g::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',g,'role','authenticated')::text,true);
 execute 'set local role authenticated';r:=public.knopik_go_coop_setup(code,gt,null,null,guest_gear||'{"protocol":6}'::jsonb);execute 'reset role';
 assert (r->>'guest_protocol')::integer=6 and r->'guest_equipment'=guest_gear;
 perform set_config('request.jwt.claim.sub',h::text,true);perform set_config('request.jwt.claims',jsonb_build_object('sub',h,'role','authenticated')::text,true);
 update public.knopik_go_coop_rooms set status='playing',host_ready=true,guest_ready=true where id=rid;
 execute 'set local role authenticated';r:=public.knopik_go_coop_advance(code,ht,10);retry:=public.knopik_go_coop_advance(code,ht,10);execute 'reset role';
 assert r=retry and r->>'mode'='abyss' and (r->>'level_id')::integer=1 and (r->>'round')::integer=11;
 assert r->'host_equipment'=host_gear and r->'guest_equipment'=guest_gear;
 -- An existing old/old room can still advance during deployment. Mixed peers cannot start/advance.
 update public.knopik_go_coop_rooms set host_protocol=5,guest_protocol=5,mode='campaign',level_id=1,round=10 where id=rid;
 execute 'set local role authenticated';r:=public.knopik_go_coop_advance(code,ht,10);execute 'reset role';assert (r->>'level_id')::integer=2;
 update public.knopik_go_coop_rooms set host_protocol=6,guest_protocol=5,round=10 where id=rid;
 execute 'set local role authenticated';begin perform public.knopik_go_coop_advance(code,ht,10);raise exception 'QA: mixed protocols advanced';exception when raise_exception then if sqlerrm like 'QA:%' then raise;end if;end;execute 'reset role';
 update public.knopik_go_coop_rooms set status='waiting',host_ready=true,guest_ready=true where id=rid;
 execute 'set local role authenticated';begin perform public.knopik_go_coop_command('start',code,ht);raise exception 'QA: mixed protocols started';exception when raise_exception then if sqlerrm like 'QA:%' then raise;end if;end;execute 'reset role';
 -- The legacy setup shape remains accepted and does not install upgrade metadata.
 execute 'set local role authenticated';r:=public.knopik_go_coop_setup(code,ht,null,null,host_gear-'weaponUpgrades');execute 'reset role';
 assert (r->>'host_protocol')::integer=5 and not(r->'host_equipment' ? 'weaponUpgrades');
 -- Verify the public save RPC keeps new fields and refuses an older-tab format downgrade.
 select * into prior from public.knopik_go_saves where user_id=h;assert found,'QA host save missing';
 format_version:=greatest(37,coalesce((prior.save->>'version')::integer,0));
 payload:=prior.save||jsonb_build_object('version',format_version,'weaponUpgrades',host_gear->'weaponUpgrades','seenSahurs',jsonb_build_array('grunt','stalker'));
 execute 'set local role authenticated';written:=public.save_knopik_go_progress(payload,prior.revision,'qa-zone-armory');
 assert written.save->'weaponUpgrades'=host_gear->'weaponUpgrades' and written.save->'seenSahurs'='["grunt","stalker"]'::jsonb and written.revision=prior.revision+1;
 returned:=public.save_knopik_go_progress(payload||jsonb_build_object('version',format_version-1,'weaponUpgrades','{}'::jsonb),written.revision,'qa-old-tab');execute 'reset role';
 assert returned.revision=written.revision and returned.save=written.save,'Old client downgraded the save';
end;$$;
rollback;
select 'Zone armory QA passed: upgrades, JSON persistence, downgrade guard, protocol6, legacy5, mixed peers, permissions and retry; all fixture changes rolled back' as result;
