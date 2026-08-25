'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTrip } from '@/lib/trips';

export type NoteFormState = { error: string | null; saved?: boolean };
function text(data: FormData, name: string) { return String(data.get(name) ?? '').trim(); }
function parse(data: FormData) {
  const title = text(data, 'title');
  if (!title || title.length > 160) return { error: 'Enter a title under 160 characters.' } as const;
  return { error: null, values: { title, body: text(data, 'body') || null } } as const;
}
function refresh(id?: string) { revalidatePath('/notes'); if (id) revalidatePath(`/notes/${id}`); }

export async function createNote(_state: NoteFormState, data: FormData): Promise<NoteFormState> {
  const trip = await getCurrentTrip();
  if (!trip) return { error: 'No current trip was found.' };
  const input = parse(data);
  if (input.error || !input.values) return { error: input.error };
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: 'Your session expired. Sign in again.' };
  const { error } = await supabase.from('notes').insert({ ...input.values, trip_id: trip.id, created_by: authData.user.id });
  if (error) return { error: error.message };
  refresh();
  if (text(data, 'presentation') === 'modal') return { error: null, saved: true };
  redirect('/notes');
}

export async function updateNote(_state: NoteFormState, data: FormData): Promise<NoteFormState> {
  const trip = await getCurrentTrip();
  const id = text(data, 'noteId');
  if (!trip || !/^[0-9a-f-]{36}$/i.test(id)) return { error: 'Note not found.' };
  const input = parse(data);
  if (input.error || !input.values) return { error: input.error };
  const { error } = await (await createClient()).from('notes').update(input.values).eq('id', id).eq('trip_id', trip.id);
  if (error) return { error: error.message };
  refresh(id);
  if (text(data, 'presentation') === 'modal') return { error: null, saved: true };
  redirect(`/notes/${id}`);
}

export async function deleteNote(data: FormData) {
  const trip = await getCurrentTrip();
  const id = text(data, 'noteId');
  if (!trip || !/^[0-9a-f-]{36}$/i.test(id)) redirect('/notes');
  await (await createClient()).from('notes').delete().eq('id', id).eq('trip_id', trip.id);
  refresh(id);
  redirect('/notes');
}
