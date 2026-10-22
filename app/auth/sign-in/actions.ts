'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type PasswordSignInState = { error: string | null };

export async function signInWithPassword(
  _previousState: PasswordSignInState,
  formData: FormData,
): Promise<PasswordSignInState> {
  const password = String(formData.get('password') ?? '');
  const requestedNext = String(formData.get('next') ?? '/');
  const nextPath = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/';
  const email = process.env.TRIP_LOGIN_EMAIL;

  if (!password) return { error: 'Enter the password to continue.' };
  if (!email) return { error: 'Password sign-in is not configured yet.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'That password is not correct. Try again.' };

  redirect(nextPath);
}
