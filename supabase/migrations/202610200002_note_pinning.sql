alter table public.notes
  add column if not exists pinned boolean not null default false;

create index if not exists notes_trip_pinned_updated_idx
  on public.notes (trip_id, pinned desc, updated_at desc);
