create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  messages_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_id_idx on public.chat_sessions(user_id);
create index if not exists chat_sessions_updated_at_idx on public.chat_sessions(updated_at desc);

alter table public.chat_sessions enable row level security;

create policy "chat_sessions_select_own"
on public.chat_sessions
for select
to authenticated
using (auth.uid() = user_id);

create policy "chat_sessions_insert_own"
on public.chat_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "chat_sessions_update_own"
on public.chat_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "chat_sessions_delete_own"
on public.chat_sessions
for delete
to authenticated
using (auth.uid() = user_id);
