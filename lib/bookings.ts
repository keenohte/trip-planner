import { createClient } from '@/lib/supabase/server';
import type { BookingType } from '@/lib/booking-types';

export type Booking = {
  id: string;
  tripId: string;
  type: BookingType;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string;
  cityRoute: string | null;
  provider: string | null;
  confirmation: string | null;
  bookingUrl: string | null;
  mapsUrl: string | null;
  locationAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  websiteUrl: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
};

type BookingRow = {
  id: string;
  trip_id: string;
  type: BookingType;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
  timezone: string | null;
  city_route: string | null;
  provider: string | null;
  confirmation: string | null;
  booking_url: string | null;
  maps_url: string | null;
  location_address: string | null;
  latitude: number | null;
  longitude: number | null;
  website_url: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
};

const fields = 'id, trip_id, type, title, starts_at, ends_at, timezone, city_route, provider, confirmation, booking_url, maps_url, location_address, latitude, longitude, website_url, notes, created_by, created_at';

function mapBooking(row: BookingRow, tripTimezone: string): Booking {
  return {
    id: row.id,
    tripId: row.trip_id,
    type: row.type,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timezone: row.timezone || tripTimezone,
    cityRoute: row.city_route,
    provider: row.provider,
    confirmation: row.confirmation,
    bookingUrl: row.booking_url,
    mapsUrl: row.maps_url,
    locationAddress: row.location_address,
    latitude: row.latitude,
    longitude: row.longitude,
    websiteUrl: row.website_url,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function getBookings(tripId: string, tripTimezone: string): Promise<Booking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select(fields)
    .eq('trip_id', tripId)
    .order('starts_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) return [];
  return ((data ?? []) as BookingRow[]).map((row) => mapBooking(row, tripTimezone));
}

export async function getBooking(tripId: string, bookingId: string, tripTimezone: string): Promise<Booking | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select(fields)
    .eq('trip_id', tripId)
    .eq('id', bookingId)
    .maybeSingle();
  if (error || !data) return null;
  return mapBooking(data as BookingRow, tripTimezone);
}
