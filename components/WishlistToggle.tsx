'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function WishlistToggle({ id, tripId, done, title }: { id: string; tripId: string; done: boolean; title: string }) {
  const router = useRouter();
  const [checked, setChecked] = useState(done);
  const [pending, setPending] = useState(false);
  async function toggle() {
    setPending(true);
    const next = !checked;
    const { error } = await createClient().from('wishlist_items').update({ done: next }).eq('id', id).eq('trip_id', tripId);
    if (!error) { setChecked(next); router.refresh(); }
    setPending(false);
  }
  return <button className={`wishlist-check${checked ? ' checked' : ''}`} type="button" aria-label={`${checked ? 'Mark' : 'Mark'} ${title} ${checked ? 'not done' : 'done'}`} aria-pressed={checked} disabled={pending} onClick={toggle}><span aria-hidden="true">{checked ? '✓' : ''}</span></button>;
}
