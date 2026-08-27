import { cache } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { MUTATION_TIMEOUT_MS, QUERY_TIMEOUT_MS, withTimeout } from '@/lib/with-timeout';

export type CurrentTrip = {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  timezone: string;
  role: 'owner' | 'member';
};

/* cache() matters more than the timeout here.

   Without it every caller made its own round trip and independently raced
   the deadline — so Nav could resolve the trip while the page beside it
   timed out and rendered the "no trip" hero. One render, two different
   answers about whether the trip exists. cache() collapses them into a
   single lookup per render pass, so the whole page agrees.

   `timeoutMs` is a plain number so cache() can key on it; reads and
   mutations therefore get separate entries, which is what we want. */
const loadTrip = cache(async (timeoutMs: number): Promise<CurrentTrip | null> => {
  if (!isSupabaseConfigured) return null;

  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const data = await withTimeout(
    supabase
      .from('trip_members')
      .select('role, trip:trips!inner(id, name, start_date, end_date, timezone, created_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then((result) => (result.error ? null : result.data)),
    timeoutMs,
    null,
  );

  if (!data?.trip) return null;

  const trip = data.trip as unknown as {
    id: string;
    name: string;
    start_date: string | null;
    end_date: string | null;
    timezone: string;
  };

  return {
    id: trip.id,
    name: trip.name,
    startDate: trip.start_date,
    endDate: trip.end_date,
    timezone: trip.timezone,
    role: data.role as CurrentTrip['role'],
  };
});

/** For rendering. Degrades to null quickly so a page can still paint. */
export const getCurrentTrip = () => loadTrip(QUERY_TIMEOUT_MS);

/** For server actions. Waits far longer, because reporting "not found"
    on a write when the record exists is worse than making someone wait. */
export const getTripForMutation = () => loadTrip(MUTATION_TIMEOUT_MS);

