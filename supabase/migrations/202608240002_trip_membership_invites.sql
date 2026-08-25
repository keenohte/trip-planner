-- Milestone 2: secure two-person trip membership and expiring invitations.

create extension if not exists pgcrypto with schema extensions;

create table public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (accepted_by is null and accepted_at is null)
    or (accepted_by is not null and accepted_at is not null)
  )
);

create index trip_invites_trip_id_idx on public.trip_invites(trip_id);
create index trip_invites_expires_at_idx on public.trip_invites(expires_at);

alter table public.trip_invites enable row level security;

create policy "members can read trip invites" on public.trip_invites
for select to authenticated
using (private.is_trip_member(trip_id));

create policy "members can create trip invites" on public.trip_invites
for insert to authenticated
with check (
  private.is_trip_member(trip_id)
  and created_by = auth.uid()
  and accepted_by is null
  and accepted_at is null
  and expires_at > now()
  and expires_at <= now() + interval '8 days'
);

create policy "invite creators or owners can delete trip invites" on public.trip_invites
for delete to authenticated
using (created_by = auth.uid() or private.is_trip_owner(trip_id));

create function public.accept_trip_invite(raw_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched_invite public.trip_invites%rowtype;
  current_member_count integer;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  if raw_token is null or length(raw_token) < 32 or length(raw_token) > 256 then
    raise exception using errcode = 'P0001', message = 'Invite is invalid or expired.';
  end if;

  select * into matched_invite
  from public.trip_invites
  where token_hash = encode(extensions.digest(raw_token, 'sha256'), 'hex')
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'Invite is invalid or expired.';
  end if;

  -- Serialize membership changes for this trip so concurrent invites cannot
  -- exceed the product's two-person limit.
  perform 1 from public.trips where id = matched_invite.trip_id for update;

  if exists (
    select 1 from public.trip_members
    where trip_id = matched_invite.trip_id and user_id = auth.uid()
  ) then
    raise exception using errcode = 'P0001', message = 'You already belong to this trip.';
  end if;

  select count(*) into current_member_count
  from public.trip_members
  where trip_id = matched_invite.trip_id;

  if current_member_count >= 2 then
    raise exception using errcode = '23514', message = 'This trip already has two members.';
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (matched_invite.trip_id, auth.uid(), 'member'::public.trip_member_role);

  update public.trip_invites
  set accepted_by = auth.uid(), accepted_at = now()
  where id = matched_invite.id;

  return matched_invite.trip_id;
end;
$$;

revoke all on function public.accept_trip_invite(text) from public;
grant execute on function public.accept_trip_invite(text) to authenticated;

-- Defense in depth: anonymous clients receive no table privileges, while RLS
-- remains the authorization boundary for signed-in clients.
revoke all on table public.trips, public.trip_members, public.ideas,
  public.idea_votes, public.bookings, public.wishlist_items, public.notes,
  public.trip_invites from anon;

grant select, insert, update, delete on table public.trips to authenticated;
grant select on table public.trip_members to authenticated;
grant select, insert, update, delete on table public.ideas to authenticated;
grant select, insert, update, delete on table public.idea_votes to authenticated;
grant select, insert, update, delete on table public.bookings to authenticated;
grant select, insert, update, delete on table public.wishlist_items to authenticated;
grant select, insert, update, delete on table public.notes to authenticated;
grant select, insert, delete on table public.trip_invites to authenticated;

