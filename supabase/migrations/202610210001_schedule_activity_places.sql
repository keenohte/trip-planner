-- Give custom schedule entries the same place metadata already available
-- on ideas and bookings so every scheduled item can participate in the map.
alter table public.schedule_activities
  add column if not exists maps_url text,
  add column if not exists location_address text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists website_url text;

comment on column public.schedule_activities.maps_url is 'Optional Google Maps link for this scheduled location.';
comment on column public.schedule_activities.location_address is 'Formatted address resolved from maps_url when saved.';
comment on column public.schedule_activities.latitude is 'Latitude resolved from maps_url when saved.';
comment on column public.schedule_activities.longitude is 'Longitude resolved from maps_url when saved.';
comment on column public.schedule_activities.website_url is 'Optional venue or event website.';

notify pgrst, 'reload schema';
