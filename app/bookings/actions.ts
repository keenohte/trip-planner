'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { bookingTypes } from '@/lib/booking-types';
import { isValidTimeZone, localDateTimeToIso } from '@/lib/datetime';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTrip } from '@/lib/trips';

export type BookingFormState = { error: string | null; saved?: boolean };

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? '').trim();
}

function optionalText(formData: FormData, name: string) {
  return text(formData, name) || null;
}

function parseBookingInput(formData: FormData, tripTimezone: string) {
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

  const bookingUrl = optionalText(formData, 'bookingUrl');
  if (bookingUrl) {
    try {
      const url = new URL(bookingUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch {
      return { error: 'Enter a valid Booking URL.' } as const;
    }
  }

  return { error: null, values: {
    title,
    type,
    starts_at: startsAt,
    ends_at: endsAt,
    timezone,
    city_route: optionalText(formData, 'cityRoute'),
    provider: optionalText(formData, 'provider'),
    confirmation: optionalText(formData, 'confirmation'),
    booking_url: bookingUrl,
    notes: optionalText(formData, 'notes'),
  } } as const;
}

function revalidateBookingPaths(id?: string) {
  revalidatePath('/');
  revalidatePath('/bookings');
  revalidatePath('/schedule');
  if (id) revalidatePath(`/bookings/${id}`);
}

export async function createBooking(_state: BookingFormState, formData: FormData): Promise<BookingFormState> {
  const trip = await getCurrentTrip();
  if (!trip) return { error: 'No current trip was found.' };
  const input = parseBookingInput(formData, trip.timezone);
  if (input.error || !input.values) return { error: input.error };
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: 'Your session expired. Sign in again.' };
  const { error } = await supabase.from('bookings').insert({ ...input.values, trip_id: trip.id, created_by: authData.user.id });
  if (error) return { error: error.message };
  revalidateBookingPaths();
  if (text(formData, 'presentation') === 'modal') return { error: null, saved: true };
  redirect('/bookings');
}

export async function updateBooking(_state: BookingFormState, formData: FormData): Promise<BookingFormState> {
  const trip = await getCurrentTrip();
  const bookingId = text(formData, 'bookingId');
  if (!trip || !/^[0-9a-f-]{36}$/i.test(bookingId)) return { error: 'Booking not found.' };
  const input = parseBookingInput(formData, trip.timezone);
  if (input.error || !input.values) return { error: input.error };
  const supabase = await createClient();
  const { error } = await supabase.from('bookings').update(input.values).eq('id', bookingId).eq('trip_id', trip.id);
  if (error) return { error: error.message };
  revalidateBookingPaths(bookingId);
  if (text(formData, 'presentation') === 'modal') return { error: null, saved: true };
  redirect(`/bookings/${bookingId}`);
}

export async function deleteBooking(formData: FormData) {
  const trip = await getCurrentTrip();
  const bookingId = text(formData, 'bookingId');
  if (!trip || !/^[0-9a-f-]{36}$/i.test(bookingId)) redirect('/bookings');
  const supabase = await createClient();
  await supabase.from('bookings').delete().eq('id', bookingId).eq('trip_id', trip.id);
  revalidateBookingPaths(bookingId);
  redirect('/bookings');
}
