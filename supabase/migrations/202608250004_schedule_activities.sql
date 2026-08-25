-- Custom itinerary entries that do not need the full Idea or Booking model.
create table if not exists public.schedule_activities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  country text,
  city text,
  neighborhood text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  image_url text,
  cover_url text,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create index if not exists schedule_activities_trip_id_idx on public.schedule_activities(trip_id);

create or replace function private.preserve_schedule_activity_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.trip_id <> old.trip_id or new.created_by <> old.created_by then
    raise exception 'Schedule activity identity cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists set_schedule_activities_updated_at on public.schedule_activities;
create trigger set_schedule_activities_updated_at before update on public.schedule_activities
for each row execute function private.set_updated_at();
drop trigger if exists preserve_schedule_activity_identity on public.schedule_activities;
create trigger preserve_schedule_activity_identity before update on public.schedule_activities
for each row execute function private.preserve_schedule_activity_identity();

alter table public.schedule_activities enable row level security;
drop policy if exists "members can read schedule activities" on public.schedule_activities;
create policy "members can read schedule activities" on public.schedule_activities for select to authenticated using (private.is_trip_member(trip_id));
drop policy if exists "members can create schedule activities" on public.schedule_activities;
create policy "members can create schedule activities" on public.schedule_activities for insert to authenticated with check (private.is_trip_member(trip_id) and created_by = auth.uid());
drop policy if exists "members can update schedule activities" on public.schedule_activities;
create policy "members can update schedule activities" on public.schedule_activities for update to authenticated using (private.is_trip_member(trip_id)) with check (private.is_trip_member(trip_id));
drop policy if exists "members can delete schedule activities" on public.schedule_activities;
create policy "members can delete schedule activities" on public.schedule_activities for delete to authenticated using (private.is_trip_member(trip_id));

do $$ begin
  alter publication supabase_realtime add table public.schedule_activities;
exception when duplicate_object then null;
end $$;

-- Make the new table immediately visible to PostgREST after dashboard execution.
notify pgrst, 'reload schema';
