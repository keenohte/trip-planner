'use server';

import { isGoogleMapsUrl, resolveGoogleMapsPlace } from '@/lib/google-maps';

export type PlaceLookup = {
  title: string | null;
  country: string | null;
  city: string | null;
  neighborhood: string | null;
};

/* Called from the form when a Maps link is pasted. Read-only, no writes,
   no auth-sensitive data — it resolves a public URL the person already
   has. The same resolution runs again on save as a backstop, so this is
   a speed and confirmation feature rather than the only path. */
export async function lookupPlace(mapsUrl: string): Promise<PlaceLookup> {
  if (!mapsUrl || !isGoogleMapsUrl(mapsUrl)) {
    return { title: null, country: null, city: null, neighborhood: null };
  }
  const place = await resolveGoogleMapsPlace(mapsUrl);
  return { title: place.title, country: place.country, city: place.city, neighborhood: place.neighborhood };
}
