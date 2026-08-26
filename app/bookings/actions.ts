'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { bookingTypes } from '@/lib/booking-types';
import { isValidTimeZone, localDateTimeToIso } from '@/lib/datetime';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTrip } from '@/lib/trips';
import { isGoogleMapsUrl, resolveGoogleMapsAddress } from '@/lib/google-maps';

export type BookingFormState = { error: string | null; saved?: boolean };

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? '').trim();
}

function optionalText(formData: FormData, name: string) {
  return text(formData, name) || null;
}

function parseUrl(formData: FormData, name: string) {
  const value = optionalText(formData, name);
  if (!value) return { value: null, error: null };
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return { value: url.toString(), error: null };
  } catch {
    return { value: null, error: `Enter a valid ${name.replace('Url', '')} URL.` };
  }
}

async function parseBookingInput(formData: FormData, tripTimezone: string) {
  const title = text(formData, 'title');
  if (!title || title.length > 160) return { error: 'Enter a title under 160 characters.' } as const;
  const type = text(formData, 'type');
  if (!bookingTypes.includes(type as (typeof bookingTypes)[number])) return { error: 'Choose a valid Booking type.' } as const;

  const timezone = text(formData, 'timezone') || tripTimezone;
  if (!isValidTimeZone(timezone)) return { error: 'Enter a valid IANA timezone, such as Asia/Tokyo.' } as const;
  const startsAtInput = text(formData, 'startsAt');
  const endsAtInput = text(formData, 'endsAt');
  const startsAt = startsAtInput ? localDateTimeToIso(startsAtInput, timezone) : null;
  const endsAt = endsAtInput ? localDateTimeToIso(endsAtInput, timezone) : null;
  if (startsAtInput && !startsAt) return { error: `Enter a valid start time in ${timezone}.` } as const;
  if (endsAtInput && !endsAt) return { error: `Enter a valid end time in ${timezone}.` } as const;
  if (endsAt && !startsAt) return { error: 'Add a start time before adding an end time.' } as const;
  if (startsAt && endsAt && endsAt < startsAt) return { error: 'The end time must be after the start time.' } as const;

  const bookingUrl = parseUrl(formData, 'bookingUrl');
  const mapsUrl = parseUrl(formData, 'mapsUrl');
  const websiteUrl = parseUrl(formData, 'websiteUrl');
  if (mapsUrl.value && !isGoogleMapsUrl(mapsUrl.value)) return { error: 'Enter a Google Maps link.' } as const;
  const urlError = bookingUrl.error ?? mapsUrl.error ?? websiteUrl.error;
  if (urlError) return { error: urlError } as const;

  return { error: null, values: {
    title,
    type,
    starts_at: startsAt,
    ends_at: endsAt,
    timezone,
    city_route: optionalText(formData, 'cityRoute'),
    provider: optionalText(formData, 'provider'),
    confirmation: optionalText(formData, 'confirmation'),
    booking_url: bookingUrl.value,
    maps_url: mapsUrl.value,
    location_address: await resolveGoogleMapsAddress(mapsUrl.value),
    website_url: websiteUrl.value,
    notes: optionalText(formData, 'notes'),
  } } as const;
}

function revalidateBookingPaths() {
  revalidatePath('/');
  revalidatePath('/bookings');
  revalidatePath('/schedule');
}

export async function createBooking(_state: BookingFormState, formData: FormData): Promise<BookingFormState> {
  const trip = await getCurrentTrip();
  if (!trip) return { error: 'No current trip was found.' };
  const input = await parseBookingInput(formData, trip.timezone);
  if (input.error || !input.values) return { error: input.error };
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: 'Your session expired. Sign in again.' };
  const { error } = await supabase.from('bookings').insert({ ...input.values, trip_id: trip.id, created_by: authData.user.id });
  if (error) return { error: error.message };
  revalidateBookingPaths();
  return { error: null, saved: true };
}

export async function updateBooking(_state: BookingFormState, formData: FormData): Promise<BookingFormState> {
  const trip = await getCurrentTrip();
  const bookingId = text(formData, 'bookingId');
  if (!trip || !/^[0-9a-f-]{36}$/i.test(bookingId)) return { error: 'Booking not found.' };
  const input = await parseBookingInput(formData, trip.timezone);
  if (input.error || !input.values) return { error: input.error };
  const supabase = await createClient();
  const { error } = await supabase.from('bookings').update(input.values).eq('id', bookingId).eq('trip_id', trip.id);
  if (error) return { error: error.message };
  revalidateBookingPaths();
  return { error: null, saved: true };
}

export async function deleteBooking(formData: FormData) {
  const trip = await getCurrentTrip();
  const bookingId = text(formData, 'bookingId');
  if (!trip || !/^[0-9a-f-]{36}$/i.test(bookingId)) redirect('/bookings');
  const supabase = await createClient();
  await supabase.from('bookings').delete().eq('id', bookingId).eq('trip_id', trip.id);
  revalidateBookingPaths();
  redirect('/bookings');
}
