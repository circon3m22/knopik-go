-- Exercise the public RPC as the actual database role used by PostgREST.
-- Every code, wallet/history update and redemption below is rolled back.
begin;
do $$
declare
 code text:='QA_'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,18));
 creator uuid;
begin
 select id into creator from public.profiles where is_admin order by id limit 1;
 if creator is null then select id into strict creator from public.profiles where lower(username)='foma';end if;
 insert into public.knopik_go_promo_codes(code,amount,created_by) values(code,317,creator);
 perform set_config('knopik.qa.promo',code,true);
 perform set_config('knopik.qa.other_go',coalesce((select md5(jsonb_agg(to_jsonb(s) order by user_id)::text) from public.knopik_go_saves s where user_id<>'f53a06e6-f782-4969-935a-124a0ea9abe5'::uuid),''),true);
 perform set_config('knopik.qa.tap',coalesce((select md5(jsonb_agg(to_jsonb(s) order by user_id)::text) from public.game_saves s),''),true);
end;$$;
set local role authenticated;
select set_config('request.jwt.claim.sub','f53a06e6-f782-4969-935a-124a0ea9abe5',true) is not null as qa_user_set;
do $$
declare
 before_save jsonb;before_revision bigint;result jsonb;after_save jsonb;after_revision bigint;
 code text:=current_setting('knopik.qa.promo');expected bigint;
begin
 assert current_user='authenticated';
 assert not has_schema_privilege(current_user,'private','USAGE'),'private schema must remain closed';
 select save,revision into strict before_save,before_revision from public.knopik_go_saves where user_id=auth.uid();
 result:=public.redeem_knopik_go_promo_code(lower(code));
 expected:=least(9007199254740991::bigint,greatest(0,coalesce((before_save->>'walletCoins')::bigint,0))+317);
 assert result->>'amount'='317';assert (result->'save'->>'walletCoins')::bigint=expected;
 assert ((result->'save')-'walletCoins')=(before_save-'walletCoins'),'promo changed unrelated progress';
 select save,revision into strict after_save,after_revision from public.knopik_go_saves where user_id=auth.uid();
 assert after_save=result->'save' and after_revision=before_revision+1;
 begin
  perform public.redeem_knopik_go_promo_code(code);
  raise exception 'QA: reused code accepted';
 exception when unique_violation then null;end;
 assert (select revision=after_revision and save=after_save from public.knopik_go_saves where user_id=auth.uid());
 begin
  perform public.redeem_knopik_go_promo_code('bad ?');raise exception 'QA: invalid format accepted';
 exception when invalid_parameter_value then null;end;
 begin
  perform public.redeem_knopik_go_promo_code(code||'_X');raise exception 'QA: nonexistent code accepted';
 exception when no_data_found then null;end;
end;$$;
-- A non-GO identity must still be refused before looking up/consuming a code.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true) is not null as qa_denied_user_set;
do $$ begin
 begin perform public.redeem_knopik_go_promo_code(current_setting('knopik.qa.promo'));raise exception 'QA: GO restriction removed';exception when insufficient_privilege then null;end;
end;$$;
set local role anon;
do $$ begin
 begin perform public.redeem_knopik_go_promo_code(current_setting('knopik.qa.promo'));raise exception 'QA: anonymous execution allowed';exception when insufficient_privilege then null;end;
end;$$;
reset role;
do $$ begin
 assert not has_function_privilege('anon','public.redeem_knopik_go_promo_code(text)','EXECUTE');
 assert not (select prosecdef from pg_proc where oid='public.redeem_knopik_go_promo_code(text)'::regprocedure);
 assert current_setting('knopik.qa.other_go')=coalesce((select md5(jsonb_agg(to_jsonb(s) order by user_id)::text) from public.knopik_go_saves s where user_id<>'f53a06e6-f782-4969-935a-124a0ea9abe5'::uuid),'');
 assert current_setting('knopik.qa.tap')=coalesce((select md5(jsonb_agg(to_jsonb(s) order by user_id)::text) from public.game_saves s),'');
 assert (select redeemed_by='f53a06e6-f782-4969-935a-124a0ea9abe5'::uuid and redeemed_at is not null from public.knopik_go_promo_codes where code=current_setting('knopik.qa.promo'));
end;$$;
rollback;
select 'Promo QA passed as authenticated/anon: reward once, revision +1, access and other saves preserved; all test writes rolled back' as result;
