'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type CreateTripState = { error: string | null };

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isValidTimezone(value: string) {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export async function createTrip(
  _previousState: CreateTripState,
  formData: FormData,
): Promise<CreateTripState> {
  const name = String(formData.get('name') ?? '').trim();
  const startDate = String(formData.get('startDate') ?? '').trim();
  const endDate = String(formData.get('endDate') ?? '').trim();
  const timezone = String(formData.get('timezone') ?? '').trim();

  if (!name || name.length > 100) return { error: 'Enter a trip name under 100 characters.' };
  if (startDate && !isValidDate(startDate)) return { error: 'Enter a valid start date.' };
  if (endDate && !isValidDate(endDate)) return { error: 'Enter a valid end date.' };
  if (startDate && endDate && endDate < startDate) {
    return { error: 'The end date must be on or after the start date.' };
  }
  if (!isValidTimezone(timezone)) return { error: 'Enter a valid IANA timezone.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Your session expired. Sign in again.' };

  const { error } = await supabase.from('trips').insert({
    name,
    start_date: startDate || null,
    end_date: endDate || null,
    timezone,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  redirect('/');
}

