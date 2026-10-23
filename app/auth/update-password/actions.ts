'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type UpdatePasswordState = { error: string | null };

export async function updatePassword(
  _previousState: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const password = String(formData.get('password') ?? '');
  const confirmation = String(formData.get('confirmation') ?? '');

  if (password.length < 8) return { error: 'Use at least 8 characters.' };
  if (password !== confirmation) return { error: 'The passwords do not match.' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'This recovery link is invalid or has expired. Request a new one.' };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: 'Could not update the password. Request a new recovery link.' };

  redirect('/');
}
