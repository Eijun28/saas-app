-- ============================================
-- Messaging V2 (clean restart): requests -> conversations -> messages
-- Contraintes métier:
-- - couple_id / provider_id = auth.users.id (uuid)
-- - 1 demande par binôme (couple_id, provider_id)
-- - Chat activé uniquement si request.status = accepted (1:1 request -> conversation)
-- - Annulation possible uniquement si pending
-- ============================================

-- Nettoyage (au cas où) : ne touche QUE ces objets
drop table if exists public.messages cascade;
drop table if exists public.conversations cascade;
drop table if exists public.requests cascade;
drop type if exists public.request_status;

-- Enum statut
create type public.request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');

-- Demandes
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null,
  provider_id uuid not null,
  status public.request_status not null default 'pending',
  initial_message text not null,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  responded_at timestamptz
);

create unique index requests_unique_binome
  on public.requests (couple_id, provider_id);

create index requests_provider_status_idx
  on public.requests (provider_id, status, created_at desc);

-- Conversations (1:1 avec request acceptée)
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.requests(id) on delete cascade,
  couple_id uuid not null,
  provider_id uuid not null,
  created_at timestamptz not null default now()
);

create index conversations_couple_id_idx on public.conversations (couple_id);
create index conversations_provider_id_idx on public.conversations (provider_id);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  content text not null check (char_length(content) > 0),
  created_at timestamptz not null default now()
);

create index messages_conversation_created_idx
  on public.messages (conversation_id, created_at asc);

-- ============================================
-- RLS
-- ============================================
alter table public.requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- REQUESTS: SELECT parties
create policy requests_select_parties
on public.requests for select
using (auth.uid() = couple_id or auth.uid() = provider_id);

-- REQUESTS: INSERT (couple only, pending only)
create policy requests_insert_couple_pending
on public.requests for insert
with check (auth.uid() = couple_id and status = 'pending');

-- REQUESTS: UPDATE (provider accepts/rejects)
create policy requests_update_provider_status
on public.requests for update
using (auth.uid() = provider_id)
with check (auth.uid() = provider_id and status in ('accepted','rejected'));

-- REQUESTS: UPDATE (couple cancels)
create policy requests_cancel_by_couple
on public.requests for update
using (auth.uid() = couple_id)
with check (auth.uid() = couple_id and status = 'cancelled');

-- CONVERSATIONS: SELECT parties, no direct insert
create policy conversations_select_parties
on public.conversations for select
using (auth.uid() = couple_id or auth.uid() = provider_id);

create policy conversations_no_direct_insert
on public.conversations for insert
with check (false);

-- MESSAGES: SELECT/INSERT only if user is participant
create policy messages_select_parties
on public.messages for select
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and auth.uid() in (c.couple_id, c.provider_id)
  )
);

create policy messages_insert_participants_only
on public.messages for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and auth.uid() in (c.couple_id, c.provider_id)
  )
);

-- ============================================
-- Trigger: status transitions + timestamps + auto-create conversation on accepted
-- ============================================
create or replace function public.handle_request_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.status <> new.status then
    if old.status <> 'pending' then
      raise exception 'Invalid status transition from % to %', old.status, new.status;
    end if;

    if new.status = 'accepted' then
      new.responded_at := now();
      insert into public.conversations (request_id, couple_id, provider_id)
      values (new.id, new.couple_id, new.provider_id)
      on conflict (request_id) do nothing;

    elsif new.status = 'rejected' then
      new.responded_at := now();

    elsif new.status = 'cancelled' then
      new.cancelled_at := now();

    else
      raise exception 'Invalid target status %', new.status;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_requests_status_change on public.requests;
create trigger trg_requests_status_change
before update of status on public.requests
for each row
execute function public.handle_request_status_change();

