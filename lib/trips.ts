import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('trip_members')
    .select('role, trip:trips!inner(id, name, start_date, end_date, timezone, created_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.trip) return null;

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

