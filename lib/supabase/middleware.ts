import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig, isSupabaseConfigured } from './env';

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

  // getUser validates the session with Supabase Auth and refreshes stale cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    const { data: membership } = await supabase
      .from('trip_members')
      .select('trip_id')
      .limit(1)
      .maybeSingle();
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
