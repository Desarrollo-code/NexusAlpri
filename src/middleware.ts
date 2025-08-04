
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

const APP_PATHS = ['/dashboard', '/courses', '/my-courses', '/profile', '/manage-courses', '/users', '/settings', '/analytics', '/security-audit', '/enrollments', '/notifications', '/calendar', '/resources'];
const AUTH_PATHS = ['/sign-in', '/sign-up'];
const API_AUTH_PREFIX = '/api/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSession(request);

  // Allow static files, image optimization, and uploads to pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/uploads') ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  const isAppRoute = APP_PATHS.some(path => pathname.startsWith(path));
  const isAuthRoute = AUTH_PATHS.some(path => pathname.startsWith(path));

  // If user is logged in
  if (session) {
    // If they are on an auth page, redirect to dashboard
    if (isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Otherwise, allow the request
    return NextResponse.next();
  }

  // If user is not logged in
  if (!session) {
    // And they are trying to access a protected app route
    if (isAppRoute) {
      // If it's an API call, return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
      }
      // For page visits, redirect to sign-in, preserving the intended destination
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Allow all other requests (public pages, public API routes)
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except for static files and image optimization
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
