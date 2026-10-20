import { createClient } from '@/lib/supabase/server';

export type ScheduleComment = {
  id: string;
  source: 'idea' | 'booking' | 'activity';
  itemId: string;
  body: string;
  createdAt: string;
};

type CommentRow = { id: string; source: ScheduleComment['source']; item_id: string; body: string; created_at: string };

export async function getScheduleComments(tripId: string): Promise<ScheduleComment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('schedule_comments').select('id, source, item_id, body, created_at').eq('trip_id', tripId).order('created_at');
  if (error) return [];
  return ((data ?? []) as CommentRow[]).map((row) => ({ id: row.id, source: row.source, itemId: row.item_id, body: row.body, createdAt: row.created_at }));
}
