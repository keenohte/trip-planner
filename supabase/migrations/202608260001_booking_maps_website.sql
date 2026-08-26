-- Optional booking links and a normalized display address derived from Google Maps.
alter table public.bookings
  add column if not exists maps_url text,
  add column if not exists location_address text,
  add column if not exists website_url text;

comment on column public.bookings.maps_url is 'Optional Google Maps link for the booking location.';
comment on column public.bookings.location_address is 'Formatted address resolved from maps_url when the booking is saved.';
comment on column public.bookings.website_url is 'Optional provider or venue website.';
