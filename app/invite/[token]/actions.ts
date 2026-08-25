'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AcceptInviteState = { error: string | null };

export async function acceptInvite(
  _previousState: AcceptInviteState,
  formData: FormData,
): Promise<AcceptInviteState> {
  const token = String(formData.get('token') ?? '');
  if (token.length < 32 || token.length > 256) return { error: 'This invite is invalid.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('accept_trip_invite', { raw_token: token });
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  redirect('/');
}

