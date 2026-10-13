-- Knopik GO only: compare-and-swap saves on the owner's current revision.
-- This is SECURITY INVOKER; existing Foma-only RLS policies remain mandatory.
create or replace function public.save_knopik_go_progress(
  new_save jsonb,
  expected_revision bigint,
  save_source_id text
)
returns public.knopik_go_saves
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_save public.knopik_go_saves;
begin
  if auth.uid() is null then
    raise exception using errcode='28000', message='Sign in before saving Knopik GO';
  end if;
  if jsonb_typeof(new_save) is distinct from 'object' then
    raise exception using errcode='22023', message='Save must be a JSON object';
  end if;
  if expected_revision is null or expected_revision < 0 then
    raise exception using errcode='22023', message='Invalid expected revision';
  end if;
  if save_source_id is null or length(save_source_id) not between 1 and 160 then
    raise exception using errcode='22023', message='Invalid source identifier';
  end if;
  update public.knopik_go_saves
  set save = new_save,
      revision = revision + 1,
      source_id = save_source_id,
      updated_at = now()
  where user_id = (select auth.uid()) and revision = expected_revision
  returning * into updated_save;
  if found then return updated_save; end if;

  -- Return the winner without modifying it, so clients can detect conflicts.
  select * into updated_save from public.knopik_go_saves
  where user_id = (select auth.uid());
  if not found then
    raise exception using errcode='P0002', message='Knopik GO save does not exist';
  end if;
  return updated_save;
end;
$$;

revoke all on function public.save_knopik_go_progress(jsonb,bigint,text) from public, anon;
grant execute on function public.save_knopik_go_progress(jsonb,bigint,text) to authenticated;
