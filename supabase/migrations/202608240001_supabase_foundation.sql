-- Trip Hub foundation: schema, ownership helpers, RLS, and Idea image storage.

create schema if not exists private;

create type public.trip_member_role as enum ('owner', 'member');
create type public.vote_value as enum ('love', 'interested', 'pass');

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  start_date date,
  end_date date,
  timezone text not null default 'UTC',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.trip_members (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.trip_member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  country text,
  city text,
  neighborhood text,
  types text[] not null default '{}',
  notes text,
  maps_url text,
  website_url text,
  social_url text,
  cover_url text,
  scheduled_at timestamptz,
  scheduled_end_at timestamptz,
  manually_confirmed boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scheduled_end_at is null or scheduled_at is null or scheduled_end_at >= scheduled_at)
);

create table public.idea_votes (
  idea_id uuid not null references public.ideas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote public.vote_value not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (idea_id, user_id)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  type text not null check (length(trim(type)) > 0),
  title text not null check (length(trim(title)) > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text,
  city_route text,
  provider text,
  confirmation text,
  booking_url text,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  kind text,
  country text,
  city_area text,
  priority text,
  notes text,
  done boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  body text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trip_members_user_id_idx on public.trip_members(user_id);
create index ideas_trip_id_idx on public.ideas(trip_id);
create index idea_votes_user_id_idx on public.idea_votes(user_id);
create index bookings_trip_id_idx on public.bookings(trip_id);
create index wishlist_items_trip_id_idx on public.wishlist_items(trip_id);
create index notes_trip_id_idx on public.notes(trip_id);

create function private.is_trip_member(target_trip_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.trip_members where trip_id = target_trip_id and user_id = auth.uid());
$$;

create function private.is_trip_owner(target_trip_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = target_trip_id and user_id = auth.uid() and role = 'owner'::public.trip_member_role
  );
$$;

create function private.is_idea_member(target_idea_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.ideas
    join public.trip_members on trip_members.trip_id = ideas.trip_id
    where ideas.id = target_idea_id and trip_members.user_id = auth.uid()
  );
$$;

create function private.can_access_idea_image(object_name text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
begin
  return private.is_trip_member(split_part(object_name, '/', 1)::uuid);
exception when invalid_text_representation then
  return false;
end;
$$;

revoke all on function private.is_trip_member(uuid) from public;
revoke all on function private.is_trip_owner(uuid) from public;
revoke all on function private.is_idea_member(uuid) from public;
revoke all on function private.can_access_idea_image(text) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_trip_member(uuid) to authenticated;
grant execute on function private.is_trip_owner(uuid) to authenticated;
grant execute on function private.is_idea_member(uuid) to authenticated;
grant execute on function private.can_access_idea_image(text) to authenticated;

create function private.add_trip_creator_as_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.created_by, 'owner'::public.trip_member_role);
  return new;
end;
$$;
revoke all on function private.add_trip_creator_as_owner() from public;

create trigger add_trip_creator_as_owner after insert on public.trips
for each row execute function private.add_trip_creator_as_owner();

create function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_trips_updated_at before update on public.trips for each row execute function private.set_updated_at();
create trigger set_ideas_updated_at before update on public.ideas for each row execute function private.set_updated_at();
create trigger set_idea_votes_updated_at before update on public.idea_votes for each row execute function private.set_updated_at();
create trigger set_bookings_updated_at before update on public.bookings for each row execute function private.set_updated_at();
create trigger set_wishlist_items_updated_at before update on public.wishlist_items for each row execute function private.set_updated_at();
create trigger set_notes_updated_at before update on public.notes for each row execute function private.set_updated_at();

alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_votes enable row level security;
alter table public.bookings enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.notes enable row level security;

create policy "members can read trips" on public.trips for select to authenticated using (private.is_trip_member(id));
create policy "users can create their own trips" on public.trips for insert to authenticated with check (created_by = auth.uid());
create policy "owners can update trips" on public.trips for update to authenticated
using (private.is_trip_owner(id)) with check (private.is_trip_owner(id) and created_by = auth.uid());
create policy "owners can delete trips" on public.trips for delete to authenticated using (private.is_trip_owner(id));

create policy "members can read trip membership" on public.trip_members for select to authenticated
using (private.is_trip_member(trip_id));
-- Membership writes remain closed until Milestone 2 adds a secure invite/join path.

create policy "members can read ideas" on public.ideas for select to authenticated using (private.is_trip_member(trip_id));
create policy "members can create ideas" on public.ideas for insert to authenticated
with check (private.is_trip_member(trip_id) and created_by = auth.uid());
create policy "members can update ideas" on public.ideas for update to authenticated
using (private.is_trip_member(trip_id)) with check (private.is_trip_member(trip_id));
create policy "members can delete ideas" on public.ideas for delete to authenticated using (private.is_trip_member(trip_id));

create policy "members can read idea votes" on public.idea_votes for select to authenticated using (private.is_idea_member(idea_id));
create policy "users can create their own idea votes" on public.idea_votes for insert to authenticated
with check (user_id = auth.uid() and private.is_idea_member(idea_id));
create policy "users can update their own idea votes" on public.idea_votes for update to authenticated
using (user_id = auth.uid() and private.is_idea_member(idea_id))
with check (user_id = auth.uid() and private.is_idea_member(idea_id));
create policy "users can delete their own idea votes" on public.idea_votes for delete to authenticated
using (user_id = auth.uid() and private.is_idea_member(idea_id));

create policy "members can read bookings" on public.bookings for select to authenticated using (private.is_trip_member(trip_id));
create policy "members can create bookings" on public.bookings for insert to authenticated with check (private.is_trip_member(trip_id) and created_by = auth.uid());
create policy "members can update bookings" on public.bookings for update to authenticated using (private.is_trip_member(trip_id)) with check (private.is_trip_member(trip_id));
create policy "members can delete bookings" on public.bookings for delete to authenticated using (private.is_trip_member(trip_id));

create policy "members can read wishlist items" on public.wishlist_items for select to authenticated using (private.is_trip_member(trip_id));
create policy "members can create wishlist items" on public.wishlist_items for insert to authenticated with check (private.is_trip_member(trip_id) and created_by = auth.uid());
create policy "members can update wishlist items" on public.wishlist_items for update to authenticated using (private.is_trip_member(trip_id)) with check (private.is_trip_member(trip_id));
create policy "members can delete wishlist items" on public.wishlist_items for delete to authenticated using (private.is_trip_member(trip_id));

create policy "members can read notes" on public.notes for select to authenticated using (private.is_trip_member(trip_id));
create policy "members can create notes" on public.notes for insert to authenticated with check (private.is_trip_member(trip_id) and created_by = auth.uid());
create policy "members can update notes" on public.notes for update to authenticated using (private.is_trip_member(trip_id)) with check (private.is_trip_member(trip_id));
create policy "members can delete notes" on public.notes for delete to authenticated using (private.is_trip_member(trip_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('idea-images', 'idea-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
allowed_mime_types = excluded.allowed_mime_types;

create policy "members can read idea images" on storage.objects for select to authenticated
using (bucket_id = 'idea-images' and private.can_access_idea_image(name));
create policy "members can upload idea images" on storage.objects for insert to authenticated
with check (bucket_id = 'idea-images' and private.can_access_idea_image(name));
create policy "members can update idea images" on storage.objects for update to authenticated
using (bucket_id = 'idea-images' and private.can_access_idea_image(name))
with check (bucket_id = 'idea-images' and private.can_access_idea_image(name));
create policy "members can delete idea images" on storage.objects for delete to authenticated
using (bucket_id = 'idea-images' and private.can_access_idea_image(name));

alter publication supabase_realtime add table public.ideas;
alter publication supabase_realtime add table public.idea_votes;
