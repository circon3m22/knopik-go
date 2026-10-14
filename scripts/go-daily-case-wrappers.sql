-- Keep private schema closed; the two public entry points delegate under their
-- owner and the private function still enforces auth.uid() == Foma before access.
create or replace function public.get_knopik_go_daily_case()
returns jsonb language sql security definer set search_path = ''
as $$ select private.knopik_go_daily_case(false); $$;
create or replace function public.claim_knopik_go_daily_case()
returns jsonb language sql security definer set search_path = ''
as $$ select private.knopik_go_daily_case(true); $$;
revoke all on function public.get_knopik_go_daily_case() from public, anon;
revoke all on function public.claim_knopik_go_daily_case() from public, anon;
grant execute on function public.get_knopik_go_daily_case() to authenticated;
grant execute on function public.claim_knopik_go_daily_case() to authenticated;
