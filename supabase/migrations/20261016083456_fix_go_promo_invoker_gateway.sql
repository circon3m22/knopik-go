-- Bind the private helper at definition time. Authenticated callers need only
-- EXECUTE on this RPC, without broad USAGE on the private schema.
-- The existing private function retains GO access checks, row locks and rewards.
create or replace function public.redeem_knopik_go_promo_code(promo_code text)
returns jsonb language sql security invoker set search_path=''
begin atomic
 select private.redeem_knopik_go_promo_code(promo_code);
end;
revoke all on function public.redeem_knopik_go_promo_code(text) from public,anon;
grant execute on function public.redeem_knopik_go_promo_code(text) to authenticated;
