import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Local product work should not depend on an emailed magic link. This is
  // compiled out of production; RLS and the normal session flow stay intact.
  if (process.env.NODE_ENV === 'development') return NextResponse.next({ request });

  return updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

