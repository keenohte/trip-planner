import { createClient } from '@/lib/supabase/server';
import type { WishlistKind, WishlistPriority } from '@/lib/wishlist-types';

export type WishlistItem = {
  id: string;
  tripId: string;
  title: string;
  kind: WishlistKind | null;
  country: string | null;
  cityArea: string | null;
  priority: WishlistPriority | null;
  notes: string | null;
  done: boolean;
  createdAt: string;
};

type WishlistRow = { id: string; trip_id: string; title: string; kind: WishlistKind | null; country: string | null; city_area: string | null; priority: WishlistPriority | null; notes: string | null; done: boolean; created_at: string };
const fields = 'id, trip_id, title, kind, country, city_area, priority, notes, done, created_at';

function mapItem(row: WishlistRow): WishlistItem {
  return { id: row.id, tripId: row.trip_id, title: row.title, kind: row.kind, country: row.country, cityArea: row.city_area, priority: row.priority, notes: row.notes, done: row.done, createdAt: row.created_at };
}

export async function getWishlistItems(tripId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('wishlist_items').select(fields).eq('trip_id', tripId).order('done').order('created_at', { ascending: false });
  return error ? [] : ((data ?? []) as WishlistRow[]).map(mapItem);
}

export async function getWishlistItem(tripId: string, itemId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('wishlist_items').select(fields).eq('trip_id', tripId).eq('id', itemId).maybeSingle();
  return error || !data ? null : mapItem(data as WishlistRow);
}
