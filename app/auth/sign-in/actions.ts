'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type PasswordSignInState = { error: string | null };
export type PasswordResetRequestState = { error: string | null; sent: boolean };

async function appOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (configured) return configured;

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  const requestHeaders = await headers();
  const origin = requestHeaders.get('origin');
  if (origin) return origin;

  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  return host ? `${protocol}://${host}` : null;
}

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

  const origin = await appOrigin();
  if (!origin) return { error: 'Could not create a secure recovery link. Try again.', sent: false };

  const supabase = await createClient();
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent('/auth/update-password')}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    const rateLimited = error.status === 429 || error.code === 'over_email_send_rate_limit' || /rate limit/i.test(error.message);
    return {
      error: rateLimited
        ? 'Too many recovery emails were requested. Wait about an hour, then try again.'
        : 'Could not send the recovery email. Try again shortly.',
      sent: false,
    };
  }
  return { error: null, sent: true };
}
