create table if not exists public.schedule_comments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  source text not null check (source in ('idea', 'booking', 'activity')),
  item_id uuid not null,
  body text not null check (length(trim(body)) > 0 and length(body) <= 1000),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists schedule_comments_item_idx on public.schedule_comments(trip_id, source, item_id, created_at);

alter table public.schedule_comments enable row level security;
drop policy if exists "members can read schedule comments" on public.schedule_comments;
create policy "members can read schedule comments" on public.schedule_comments for select to authenticated using (private.is_trip_member(trip_id));
drop policy if exists "members can create schedule comments" on public.schedule_comments;
create policy "members can create schedule comments" on public.schedule_comments for insert to authenticated with check (private.is_trip_member(trip_id) and created_by = auth.uid());
drop policy if exists "members can delete schedule comments" on public.schedule_comments;
create policy "members can delete schedule comments" on public.schedule_comments for delete to authenticated using (private.is_trip_member(trip_id));

do $$ begin
  alter publication supabase_realtime add table public.schedule_comments;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
