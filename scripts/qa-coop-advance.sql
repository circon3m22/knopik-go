-- Transactional QA: throw on any regression and roll back the temporary room.
begin;
do $$
<<qa>>
declare
 h uuid:='14b063d8-1790-451b-a354-1f7dcaa41f13';g uuid:='f53a06e6-f782-4969-935a-124a0ea9abe5';
 ht uuid:=gen_random_uuid();gt uuid:=gen_random_uuid();rid uuid;code text;
 r jsonb;retry jsonb;scenario integer:=0;
 host_gear jsonb:='{"skin":"shiba-white","hat":true,"mohawk":false,"accessory":"bandana"}';
 guest_gear jsonb:='{"skin":"shiba-black","hat":false,"mohawk":true,"accessory":"cape"}';
begin
 assert not has_function_privilege('anon','public.knopik_go_coop_advance(text,uuid,integer)','EXECUTE');
 assert has_function_privilege('authenticated','public.knopik_go_coop_advance(text,uuid,integer)','EXECUTE');
 assert not (select prosecdef from pg_proc where oid='public.knopik_go_coop_advance(text,uuid,integer)'::regprocedure);
 -- Generate a valid, unused code without touching real player rooms.
 loop
  code:='QA';for i in 1..4 loop code:=code||substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',1+floor(random()*32)::integer,1);end loop;
  exit when not exists(select 1 from public.knopik_go_coop_rooms c where c.code=qa.code);
 end loop;
 insert into public.knopik_go_coop_rooms(code,host_id,guest_id,host_name,guest_name,host_token,guest_token,seed,round,status,host_ready,guest_ready,host_seen,guest_seen,mode,level_id,host_protocol,guest_protocol,host_equipment,guest_equipment)
 values(code,h,g,'QA host','QA guest',ht,gt,123,10,'playing',true,true,now(),now(),'campaign',1,3,3,host_gear,guest_gear) returning id into rid;
 perform set_config('request.jwt.claim.sub',h::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',h,'role','authenticated')::text,true);
 for level in 1..25 loop
  update public.knopik_go_coop_rooms set mode='campaign',level_id=level,round=10 where id=rid;
  r:=public.knopik_go_coop_advance(code,ht,10);
  assert r->>'status'='playing' and (r->>'round')::int=11;
  assert (r->>'level_id')::int=case when level=25 then 1 else level+1 end;
  assert r->>'mode'=case when level=25 then 'abyss' else 'campaign' end;
  assert (r->>'id')::uuid=rid and r->>'code'=code;
  assert (r->>'host_id')::uuid=h and (r->>'guest_id')::uuid=g;
  assert r->'host_equipment'=host_gear and r->'guest_equipment'=guest_gear;
  assert r->'host_ready'='true'::jsonb and r->'guest_ready'='true'::jsonb;
  assert not(r ?| array['host_token','guest_token','host_seen','guest_seen']);
  retry:=public.knopik_go_coop_advance(code,ht,10);assert retry=r,'duplicate advance skipped a level';
  scenario:=scenario+1;
 end loop;
 for m in 1..2 loop
  update public.knopik_go_coop_rooms set mode=case when m=1 then 'arcade' else 'abyss' end,level_id=9998,round=10 where id=rid;
  r:=public.knopik_go_coop_advance(code,ht,10);assert (r->>'level_id')::int=9999 and (r->>'round')::int=11;
  begin perform public.knopik_go_coop_advance(code,ht,11);raise exception 'QA: level limit not enforced';exception when raise_exception then if sqlerrm like 'QA:%' then raise;end if;end;
  scenario:=scenario+1;
 end loop;
 update public.knopik_go_coop_rooms set mode='campaign',level_id=1,round=10 where id=rid;
 perform set_config('request.jwt.claim.sub',g::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',g,'role','authenticated')::text,true);
 begin perform public.knopik_go_coop_advance(code,gt,10);raise exception 'QA: guest advanced';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claim.sub',h::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',h,'role','authenticated')::text,true);
 begin perform public.knopik_go_coop_advance(code,gt,10);raise exception 'QA: wrong device advanced';exception when insufficient_privilege then null;end;
 begin perform public.knopik_go_coop_advance(code,ht,null);raise exception 'QA: null round accepted';exception when raise_exception then if sqlerrm like 'QA:%' then raise;end if;end;
 begin perform public.knopik_go_coop_advance(code,ht,11);raise exception 'QA: future round accepted';exception when raise_exception then if sqlerrm like 'QA:%' then raise;end if;end;
 update public.knopik_go_coop_rooms set guest_seen=now()-interval '20 seconds' where id=rid;
 begin perform public.knopik_go_coop_advance(code,ht,10);raise exception 'QA: missing guest ignored';exception when raise_exception then if sqlerrm like 'QA:%' then raise;end if;end;
 update public.knopik_go_coop_rooms set guest_seen=now(),status='waiting' where id=rid;
 begin perform public.knopik_go_coop_advance(code,ht,10);raise exception 'QA: waiting room advanced';exception when raise_exception then if sqlerrm like 'QA:%' then raise;end if;end;
 update public.knopik_go_coop_rooms set status='closed' where id=rid;
 begin perform public.knopik_go_coop_advance(code,ht,10);raise exception 'QA: closed room reopened';exception when raise_exception then if sqlerrm like 'QA:%' then raise;end if;end;
 update public.knopik_go_coop_rooms set status='playing',guest_protocol=2 where id=rid;
 begin perform public.knopik_go_coop_advance(code,ht,10);raise exception 'QA: old protocol accepted';exception when raise_exception then if sqlerrm like 'QA:%' then raise;end if;end;
 assert (select round=10 and level_id=1 from public.knopik_go_coop_rooms where id=rid);
 raise notice 'Co-op advance QA passed: % valid routes + permission/retry/reconnect/limits checks',scenario;
end;$$;
rollback;
select 'Co-op advance: all assertions passed; test room rolled back' as result;
