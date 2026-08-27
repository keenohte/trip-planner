-- Store the coordinates we already resolve when saving a Google Maps link.
--
-- resolveGoogleMapsPlace() extracts lat/lng from the map URL itself, and
-- falls back to the Geocoding response, which has always contained
-- geometry.location. Both were being discarded. Persisting them costs no
-- additional API calls and unlocks map rendering, proximity checks, and
-- timezone derivation.

alter table public.ideas
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.bookings
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

comment on column public.ideas.latitude is 'Resolved from maps_url on save. Null when no map link or lookup failed.';
comment on column public.ideas.longitude is 'Resolved from maps_url on save. Null when no map link or lookup failed.';

-- Partial index: map queries only ever want rows that can be plotted.
create index if not exists ideas_coordinates_idx
  on public.ideas (trip_id)
  where latitude is not null and longitude is not null;
