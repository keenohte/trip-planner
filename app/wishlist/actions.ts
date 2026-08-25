'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTrip } from '@/lib/trips';
import { wishlistKinds, wishlistPriorities } from '@/lib/wishlist-types';

export type WishlistFormState = { error: string | null; saved?: boolean };
function text(data: FormData, name: string) { return String(data.get(name) ?? '').trim(); }
function optional(data: FormData, name: string) { return text(data, name) || null; }
function parseInput(data: FormData) {
  const title = text(data, 'title');
  if (!title || title.length > 160) return { error: 'Enter a title under 160 characters.' } as const;
  const kind = optional(data, 'kind');
  const priority = optional(data, 'priority');
  if (kind && !wishlistKinds.includes(kind as (typeof wishlistKinds)[number])) return { error: 'Choose a valid kind.' } as const;
  if (priority && !wishlistPriorities.includes(priority as (typeof wishlistPriorities)[number])) return { error: 'Choose a valid priority.' } as const;
  return { error: null, values: { title, kind, priority, country: optional(data, 'country'), city_area: optional(data, 'cityArea'), notes: optional(data, 'notes') } } as const;
}
function refresh(id?: string) { revalidatePath('/wishlist'); if (id) revalidatePath(`/wishlist/${id}`); }

export async function createWishlistItem(_state: WishlistFormState, data: FormData): Promise<WishlistFormState> {
  const trip = await getCurrentTrip();
  if (!trip) return { error: 'No current trip was found.' };
  const input = parseInput(data);
  if (input.error || !input.values) return { error: input.error };
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: 'Your session expired. Sign in again.' };
  const { error } = await supabase.from('wishlist_items').insert({ ...input.values, trip_id: trip.id, created_by: authData.user.id });
  if (error) return { error: error.message };
  refresh();
  if (text(data, 'presentation') === 'modal') return { error: null, saved: true };
  redirect('/wishlist');
}

export async function updateWishlistItem(_state: WishlistFormState, data: FormData): Promise<WishlistFormState> {
  const trip = await getCurrentTrip();
  const id = text(data, 'itemId');
  if (!trip || !/^[0-9a-f-]{36}$/i.test(id)) return { error: 'Wishlist item not found.' };
  const input = parseInput(data);
  if (input.error || !input.values) return { error: input.error };
  const { error } = await (await createClient()).from('wishlist_items').update(input.values).eq('id', id).eq('trip_id', trip.id);
  if (error) return { error: error.message };
  refresh(id);
  if (text(data, 'presentation') === 'modal') return { error: null, saved: true };
  redirect('/wishlist');
}

export async function deleteWishlistItem(data: FormData) {
  const trip = await getCurrentTrip();
  const id = text(data, 'itemId');
  if (!trip || !/^[0-9a-f-]{36}$/i.test(id)) redirect('/wishlist');
  await (await createClient()).from('wishlist_items').delete().eq('id', id).eq('trip_id', trip.id);
  refresh(id);
  redirect('/wishlist');
}
