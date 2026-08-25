'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function RealtimeRefresh({ tripId, ideaIds }: { tripId: string; ideaIds: string[] }) {
  const router = useRouter();
  const ideaKey = ideaIds.join(',');

  useEffect(() => {
    const supabase = createClient();
    let channel = supabase
      .channel(`trip-ideas-${tripId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ideas', filter: `trip_id=eq.${tripId}` },
        () => router.refresh(),
      );

    for (const ideaId of ideaIds) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'idea_votes', filter: `idea_id=eq.${ideaId}` },
        () => router.refresh(),
      );
    }
    if (ideaIds.length === 0) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table: 'idea_votes' }, () => router.refresh());
    }

    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [ideaKey, router, tripId]);

  return null;
}
