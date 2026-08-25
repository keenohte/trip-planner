'use server';

import { createHash, randomBytes } from 'crypto';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type InviteState = { error: string | null; inviteUrl: string | null };

export async function createPartnerInvite(
  _previousState: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const tripId = String(formData.get('tripId') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(tripId)) return { error: 'Invalid trip.', inviteUrl: null };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Your session expired. Sign in again.', inviteUrl: null };

  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from('trip_invites').insert({
    trip_id: tripId,
    token_hash: tokenHash,
    created_by: user.id,
    expires_at: expiresAt,
  });

  if (error) return { error: error.message, inviteUrl: null };

  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  if (!host) return { error: 'Could not determine the app URL.', inviteUrl: null };

  return { error: null, inviteUrl: `${protocol}://${host}/invite/${token}` };
}

