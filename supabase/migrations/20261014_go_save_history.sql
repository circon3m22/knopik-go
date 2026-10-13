-- Knopik GO only: preserve original save documents before changes.
-- This is deliberately separate from KNOPIK TAP's private.game_save_history.
create schema if not exists private;

create table if not exists private.knopik_go_save_history (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  save jsonb not null check (jsonb_typeof(save) = 'object'),
  revision bigint not null,
  source_id text,
  original_updated_at timestamptz not null,
  archived_at timestamptz not null default now(),
  action text not null check (action in ('baseline', 'update', 'delete'))
);

create index if not exists knopik_go_save_history_owner_idx
  on private.knopik_go_save_history(user_id, archived_at desc, id desc);

alter table private.knopik_go_save_history enable row level security;
revoke all on private.knopik_go_save_history from public, anon, authenticated;

-- Take the initial snapshot before enabling the trigger. Never replace it.
insert into private.knopik_go_save_history
  (user_id, save, revision, source_id, original_updated_at, action)
select user_id, save, revision, source_id, updated_at, 'baseline'
from public.knopik_go_saves src
where not exists (
  select 1 from private.knopik_go_save_history hist where hist.user_id = src.user_id
);

create or replace function private.archive_knopik_go_save()
returns trigger language plpgsql security definer
set search_path = ''
as $$
begin
  insert into private.knopik_go_save_history
    (user_id, save, revision, source_id, original_updated_at, action)
  values
    (old.user_id, old.save, old.revision, old.source_id, old.updated_at, lower(tg_op));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.archive_knopik_go_save() from public, anon, authenticated;

drop trigger if exists archive_knopik_go_before_change on public.knopik_go_saves;
create trigger archive_knopik_go_before_change
before update or delete on public.knopik_go_saves
for each row execute function private.archive_knopik_go_save();
