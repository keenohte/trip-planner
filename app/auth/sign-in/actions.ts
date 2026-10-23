'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type PasswordSignInState = { error: string | null };
export type PasswordResetRequestState = { error: string | null; sent: boolean };
export type PasswordResetCodeState = { error: string | null };

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

export async function requestPasswordReset(
  _previousState: PasswordResetRequestState,
): Promise<PasswordResetRequestState> {
  const email = process.env.TRIP_LOGIN_EMAIL;
  if (!email) return { error: 'Password recovery is not configured yet.', sent: false };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    const emailQuotaReached = error.code === 'over_email_send_rate_limit';
    const temporarilyLimited = error.status === 429 || /rate limit/i.test(error.message);
    return {
      error: emailQuotaReached
        ? 'The project email limit was reached. Check Supabase email rate limits, then try again.'
        : temporarilyLimited
          ? 'Please wait 60 seconds before requesting another recovery code.'
        : 'Could not send the recovery email. Try again shortly.',
      sent: false,
    };
  }
  return { error: null, sent: true };
}

export async function resetPasswordWithCode(
  _previousState: PasswordResetCodeState,
  formData: FormData,
): Promise<PasswordResetCodeState> {
  const email = process.env.TRIP_LOGIN_EMAIL;
  const code = String(formData.get('code') ?? '').replace(/\s/g, '');
  const password = String(formData.get('password') ?? '');
  const confirmation = String(formData.get('confirmation') ?? '');

  if (!email) return { error: 'Password recovery is not configured yet.' };
  if (!code) return { error: 'Enter the recovery code from the email.' };
  if (password.length < 8) return { error: 'Use at least 8 characters.' };
  if (password !== confirmation) return { error: 'The passwords do not match.' };

  const supabase = await createClient();
  const { error: verificationError } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
  if (verificationError) return { error: 'That recovery code is invalid or expired. Request a new code.' };

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) return { error: 'The code worked, but the password could not be updated. Try again.' };

  redirect('/');
}
