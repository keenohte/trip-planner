-- External image links and a normalized display address derived from Google Maps.
alter table public.ideas
  add column if not exists image_url text,
  add column if not exists location_address text;

comment on column public.ideas.image_url is 'Optional externally hosted image displayed in preference to an uploaded cover.';
comment on column public.ideas.location_address is 'Formatted address resolved from maps_url when the idea is saved.';
