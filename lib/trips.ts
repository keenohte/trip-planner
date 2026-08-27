import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import { AUTH_TIMEOUT_MS, QUERY_TIMEOUT_MS, withTimeout } from '@/lib/with-timeout';

export type CurrentTrip = {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  timezone: string;
  role: 'owner' | 'member';
};

export async function getCurrentTrip(): Promise<CurrentTrip | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();

  /* Bounded for the same reason as middleware: this runs on every page
     render, so an unbounded await here would just move the 504 from the
     edge to the render. Returning null renders the app shell with no trip
     data, which is a usable degraded state. */
  const user = await withTimeout(
    supabase.auth.getUser().then((result) => result.data.user),
    AUTH_TIMEOUT_MS,
    null,
  );
  if (!user) return null;

  const data = await withTimeout(
    supabase
      .from('trip_members')
      .select('role, trip:trips!inner(id, name, start_date, end_date, timezone, created_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then((result) => (result.error ? null : result.data)),
    QUERY_TIMEOUT_MS,
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
}

