'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTripForMutation } from '@/lib/trips';
import { localDateTimeToIso } from '@/lib/datetime';
import { ideaCategories, type IdeaCategory } from '@/lib/categories';
import { isGoogleMapsUrl, resolveGoogleMapsPlace } from '@/lib/google-maps';

export type IdeaFormState = { error: string | null; saved?: boolean };

const allowedImageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

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
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
    return { value: url.toString(), error: null };
  } catch {
    return { value: null, error: `Enter a valid ${name.replace('Url', '')} URL.` };
  }
}

async function parseIdeaInput(formData: FormData, timezone: string) {
  /* Length is checked here; emptiness is checked AFTER the Maps lookup,
     because a pasted link can supply the title. Validating first would
     reject "paste link, hit Save" — the exact flow the autofill exists
     to enable. */
  const typedTitle = text(formData, 'title');
  if (typedTitle.length > 160) return { error: 'Enter a title under 160 characters.' } as const;

  const mapsUrl = parseUrl(formData, 'mapsUrl');
  if (mapsUrl.value && !isGoogleMapsUrl(mapsUrl.value)) return { error: 'Enter a Google Maps link.' } as const;
  const websiteUrl = parseUrl(formData, 'websiteUrl');
  const socialUrl = parseUrl(formData, 'socialUrl');
  const imageUrl = parseUrl(formData, 'imageUrl');
  const urlError = mapsUrl.error ?? websiteUrl.error ?? socialUrl.error ?? imageUrl.error;
  if (urlError) return { error: urlError } as const;

  const rawCategory = text(formData, 'category');
  const category = (ideaCategories as readonly string[]).includes(rawCategory)
    ? (rawCategory as IdeaCategory)
    : 'activity';

  const tags = text(formData, 'tags')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10);

  /* `types` is still written so the column stays consistent while it
     exists. Drop this — and the column — once nothing reads it. */
  const types = [category, ...tags];

  const scheduledAtInput = text(formData, 'scheduledAt');
  const scheduledEndAtInput = text(formData, 'scheduledEndAt');
  const scheduledAt = scheduledAtInput ? localDateTimeToIso(scheduledAtInput, timezone) : null;
  const scheduledEndAt = scheduledEndAtInput ? localDateTimeToIso(scheduledEndAtInput, timezone) : null;
  if (scheduledAtInput && !scheduledAt) return { error: `Enter a valid start time in ${timezone}.` } as const;
  if (scheduledEndAtInput && !scheduledEndAt) return { error: `Enter a valid end time in ${timezone}.` } as const;
  if (scheduledEndAt && !scheduledAt) return { error: 'Add a start time before adding an end time.' } as const;
  if (scheduledAt && scheduledEndAt && scheduledEndAt < scheduledAt) return { error: 'The end time must be after the start time.' } as const;

  const place = await resolveGoogleMapsPlace(mapsUrl.value);

  /* Fill only blanks. If the client-side lookup already populated these,
     the values arrive in the form and win. If the person typed something,
     it wins. Autofill that overwrites typed input is how autofill earns
     distrust. */
  const orBlank = (typed: string | null, resolved: string | null) => (typed && typed.trim() ? typed : resolved);

  const title = orBlank(typedTitle, place.title)?.slice(0, 160) ?? '';
  if (!title) return { error: 'Enter a title, or paste a Google Maps link to fill it in.' } as const;

  return {
    error: null,
    values: {
      title,
      country: orBlank(optionalText(formData, 'country'), place.country),
      city: orBlank(optionalText(formData, 'city'), place.city),
      neighborhood: orBlank(optionalText(formData, 'neighborhood'), place.neighborhood),
      types,
      category,
      tags,
      notes: optionalText(formData, 'notes'),
      maps_url: mapsUrl.value,
      location_address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      website_url: websiteUrl.value,
      social_url: socialUrl.value,
      image_url: imageUrl.value,
      scheduled_at: scheduledAt,
      scheduled_end_at: scheduledEndAt,
    },
  } as const;
}

function getPhoto(formData: FormData) {
  const value = formData.get('photo');
  return value instanceof File && value.size > 0 ? value : null;
}

function validatePhoto(photo: File | null) {
  if (!photo) return null;
  if (!allowedImageTypes.has(photo.type)) return 'Use a JPEG, PNG, WebP, or GIF image.';
  if (photo.size > 10 * 1024 * 1024) return 'Images must be 10 MB or smaller.';
  return null;
}

async function uploadPhoto(tripId: string, ideaId: string, photo: File) {
  const supabase = await createClient();
  const extension = allowedImageTypes.get(photo.type)!;
  const path = `${tripId}/${ideaId}/${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await photo.arrayBuffer());
  const { error } = await supabase.storage
    .from('idea-images')
    .upload(path, bytes, { contentType: photo.type, upsert: false });
  return error ? { path: null, error: error.message } : { path, error: null };
}

export async function createIdea(
  _previousState: IdeaFormState,
  formData: FormData,
): Promise<IdeaFormState> {
  const trip = await getTripForMutation();
  if (!trip) return { error: 'Could not reach the server. Please try again.' };

  const input = await parseIdeaInput(formData, trip.timezone);
  if (input.error || !input.values) return { error: input.error };
  const photo = getPhoto(formData);
  const photoError = validatePhoto(photo);
  if (photoError) return { error: photoError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Your session expired. Sign in again.' };

  const { data: idea, error: insertError } = await supabase
    .from('ideas')
    .insert({ ...input.values, trip_id: trip.id, created_by: user.id })
    .select('id')
    .single();
  if (insertError || !idea) return { error: insertError?.message ?? 'Could not create the Idea.' };

  if (photo) {
    const upload = await uploadPhoto(trip.id, idea.id, photo);
    if (upload.error || !upload.path) {
      await supabase.from('ideas').delete().eq('id', idea.id);
      return { error: `The image could not be uploaded: ${upload.error}` };
    }
    const { error: coverError } = await supabase.from('ideas').update({ cover_url: upload.path, image_url: null }).eq('id', idea.id);
    if (coverError) {
      await supabase.storage.from('idea-images').remove([upload.path]);
      await supabase.from('ideas').delete().eq('id', idea.id);
      return { error: coverError.message };
    }
  }

  revalidatePath('/');
  revalidatePath('/ideas');
  revalidatePath('/schedule');
  if (text(formData, 'presentation') === 'modal') return { error: null, saved: true };
  redirect('/ideas');
}

export async function updateIdea(
  _previousState: IdeaFormState,
  formData: FormData,
): Promise<IdeaFormState> {
  const trip = await getTripForMutation();
  const ideaId = text(formData, 'ideaId');
  if (!trip) return { error: 'Could not reach the server. Please try again.' };
  if (!/^[0-9a-f-]{36}$/i.test(ideaId)) return { error: 'Idea not found.' };

  const input = await parseIdeaInput(formData, trip.timezone);
  if (input.error || !input.values) return { error: input.error };
  const photo = getPhoto(formData);
  const photoError = validatePhoto(photo);
  if (photoError) return { error: photoError };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('ideas')
    .select('cover_url')
    .eq('id', ideaId)
    .eq('trip_id', trip.id)
    .maybeSingle();
  if (!existing) return { error: 'Idea not found.' };

  let newCoverPath: string | null = null;
  if (photo) {
    const upload = await uploadPhoto(trip.id, ideaId, photo);
    if (upload.error || !upload.path) return { error: `The image could not be uploaded: ${upload.error}` };
    newCoverPath = upload.path;
  }

  const { error } = await supabase
    .from('ideas')
    .update({ ...input.values, ...(newCoverPath ? { cover_url: newCoverPath, image_url: null } : {}) })
    .eq('id', ideaId)
    .eq('trip_id', trip.id);
  if (error) {
    if (newCoverPath) await supabase.storage.from('idea-images').remove([newCoverPath]);
    return { error: error.message };
  }

  if (newCoverPath && existing.cover_url) {
    await supabase.storage.from('idea-images').remove([existing.cover_url]);
  }

  revalidatePath('/');
  revalidatePath('/ideas');
  revalidatePath('/schedule');
  revalidatePath(`/ideas/${ideaId}`);
  if (text(formData, 'presentation') === 'modal') return { error: null, saved: true };
  redirect('/ideas');
}

export async function deleteIdea(formData: FormData) {
  const trip = await getTripForMutation();
  const ideaId = text(formData, 'ideaId');
  if (!trip || !/^[0-9a-f-]{36}$/i.test(ideaId)) redirect('/ideas');

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('ideas')
    .select('cover_url')
    .eq('id', ideaId)
    .eq('trip_id', trip.id)
    .maybeSingle();
  const { error } = await supabase.from('ideas').delete().eq('id', ideaId).eq('trip_id', trip.id);
  if (!error && existing?.cover_url) await supabase.storage.from('idea-images').remove([existing.cover_url]);

  revalidatePath('/');
  revalidatePath('/ideas');
  revalidatePath('/schedule');
  redirect('/ideas');
}
