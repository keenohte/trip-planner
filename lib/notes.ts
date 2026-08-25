import { createClient } from '@/lib/supabase/server';

export type Note = { id: string; tripId: string; title: string; body: string | null; createdBy: string; createdAt: string; updatedAt: string };
type NoteRow = { id: string; trip_id: string; title: string; body: string | null; created_by: string; created_at: string; updated_at: string };
const fields = 'id, trip_id, title, body, created_by, created_at, updated_at';
function mapNote(row: NoteRow): Note { return { id: row.id, tripId: row.trip_id, title: row.title, body: row.body, createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at }; }

export async function getNotes(tripId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('notes').select(fields).eq('trip_id', tripId).order('updated_at', { ascending: false });
  return error ? [] : ((data ?? []) as NoteRow[]).map(mapNote);
}

export async function getNote(tripId: string, noteId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('notes').select(fields).eq('trip_id', tripId).eq('id', noteId).maybeSingle();
  return error || !data ? null : mapNote(data as NoteRow);
}
