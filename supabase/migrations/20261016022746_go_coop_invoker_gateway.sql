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
