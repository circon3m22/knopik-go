-- GO-specific defense: old app bundles must not silently overwrite cloud progress
-- without incrementing the revision. Activate only after the new Pages deploy.
create or replace function private.require_knopik_go_revision()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  if new.revision is distinct from old.revision + 1 then
    raise exception using
      errcode = '23514',
      message = 'Knopik GO save rejected: revision must increase exactly once';
  end if;
  return new;
end;
$$;
revoke all on function private.require_knopik_go_revision() from public, anon, authenticated;

drop trigger if exists require_knopik_go_revision_before_update on public.knopik_go_saves;
create trigger require_knopik_go_revision_before_update
before update on public.knopik_go_saves
for each row execute function private.require_knopik_go_revision();
