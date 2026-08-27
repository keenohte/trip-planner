import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { AUTH_TIMEOUT_MS, withTimeout } from '@/lib/with-timeout';

/* The single way server components read the current user.

   Two jobs. First, it is bounded — an unbounded auth.getUser() in a
   server component blocks the render, and one inside the ROOT LAYOUT
   blocks the entire document, so nothing streams and the user sees a
   blank page rather than loading.tsx.

   Second, React's cache() dedupes it within a render pass. Nav previously
   called getUser twice: once directly, once inside getCurrentTrip. Now
   that is one round trip.

   Returns null on timeout. Callers already handle a signed-out user, and
   Row Level Security — not this function — is the authorization boundary. */
export const getSessionUser = cache(async () => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  return withTimeout(
    supabase.auth.getUser().then((result) => result.data.user),
    AUTH_TIMEOUT_MS,
    null,
  );
});
