import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig, isSupabaseConfigured } from './env';
import { AUTH_TIMEOUT_MS, QUERY_TIMEOUT_MS, withTimeout } from '@/lib/with-timeout';

/* Middleware runs on nearly every request, and Vercel kills the invocation
   at ~25s. Without a bound, one degraded Supabase service takes the whole
   site down with a 504 — which is what happened when Auth went unhealthy
   while Database, PostgREST and Storage were all fine.

   These calls drive routing and cookie refresh. They are NOT the
   authorization boundary — Row Level Security is, and it applies to every
   query regardless of what middleware decides. So on timeout we let the
   request proceed rather than guessing. No data is exposed either way. */

export async function updateSession(request: NextRequest) {
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
  const isInviteRoute = request.nextUrl.pathname.startsWith('/invite/');
  const isOnboardingRoute = request.nextUrl.pathname === '/onboarding';

  if (!isSupabaseConfigured) {
    if (isAuthRoute) return NextResponse.next({ request });

    const url = request.nextUrl.clone();
    url.pathname = '/auth/sign-in';
    url.searchParams.set('reason', 'configuration');
    return NextResponse.redirect(url);
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser validates the session with Supabase Auth and refreshes stale
  // cookies. `undefined` means Auth did not answer in time — distinct from
  // `null`, which means a definite "not signed in".
  const authResult = await withTimeout(
    supabase.auth.getUser().then((result) => result.data.user),
    AUTH_TIMEOUT_MS,
    undefined,
  );
  const authUnavailable = authResult === undefined;
  const user = authResult ?? null;

  // Auth is degraded. Skip every routing decision that depends on knowing
  // who this is, rather than bouncing a signed-in person to /sign-in or
  // hanging until Vercel times the whole request out.
  if (authUnavailable) return response;

  function redirectWithSessionCookies(url: URL) {
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/sign-in';
    url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
    return redirectWithSessionCookies(url);
  }

  if (user && request.nextUrl.pathname === '/auth/sign-in') {
    const next = request.nextUrl.searchParams.get('next');
    const url = request.nextUrl.clone();
    url.pathname = next?.startsWith('/') && !next.startsWith('//') ? next : '/';
    url.search = '';
    return redirectWithSessionCookies(url);
  }

  if (user && !isAuthRoute && !isInviteRoute) {
    // Same shape as above: `undefined` means we could not find out.
    // Previously any failure here read as "no trip" and redirected a
    // legitimate user into onboarding — a slow database should not look
    // like an empty account.
    const membership = await withTimeout(
      supabase.from('trip_members').select('trip_id').limit(1).maybeSingle()
        .then((result) => result.data ?? null),
      QUERY_TIMEOUT_MS,
      undefined,
    );
    if (membership === undefined) return response;

    const hasTrip = Boolean(membership);

    if (!hasTrip && !isOnboardingRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      url.search = '';
      return redirectWithSessionCookies(url);
    }

    if (hasTrip && isOnboardingRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.search = '';
      return redirectWithSessionCookies(url);
    }
  }

  return response;
}
