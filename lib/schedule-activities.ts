import { createClient } from '@/lib/supabase/server';

export type ScheduleActivity = {
  id: string; tripId: string; title: string; country: string | null; city: string | null;
  neighborhood: string | null; startsAt: string; endsAt: string | null; imageUrl: string | null;
  externalImageUrl: string | null; coverPath: string | null; notes: string | null;
  createdBy: string; createdAt: string;
};

type Row = { id:string;trip_id:string;title:string;country:string|null;city:string|null;neighborhood:string|null;starts_at:string;ends_at:string|null;image_url:string|null;cover_url:string|null;notes:string|null;created_by:string;created_at:string };
const fields = 'id, trip_id, title, country, city, neighborhood, starts_at, ends_at, image_url, cover_url, notes, created_by, created_at';

export async function getScheduleActivities(tripId: string): Promise<ScheduleActivity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('schedule_activities').select(fields).eq('trip_id', tripId).order('starts_at');
  if (error) return [];
  const rows = (data ?? []) as Row[];
  const paths = rows.flatMap((row) => row.cover_url ? [row.cover_url] : []);
  const { data: signed } = paths.length ? await supabase.storage.from('idea-images').createSignedUrls(paths, 3600) : { data: [] };
  const urls = new Map((signed ?? []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl]));
  return rows.map((row) => ({ id:row.id,tripId:row.trip_id,title:row.title,country:row.country,city:row.city,neighborhood:row.neighborhood,startsAt:row.starts_at,endsAt:row.ends_at,imageUrl:row.image_url ?? (row.cover_url ? urls.get(row.cover_url) ?? null : null),externalImageUrl:row.image_url,coverPath:row.cover_url,notes:row.notes,createdBy:row.created_by,createdAt:row.created_at }));
}
