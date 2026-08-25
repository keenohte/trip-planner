'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function TableRealtimeRefresh({ tripId, table }: { tripId: string; table: 'wishlist_items' | 'notes' }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`trip-${table}-${tripId}`).on('postgres_changes', { event: '*', schema: 'public', table, filter: `trip_id=eq.${tripId}` }, () => router.refresh()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [router, table, tripId]);
  return null;
}
