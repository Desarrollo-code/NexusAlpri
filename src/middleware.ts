
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const IS_APP_ROUTE_REGEX = /^\/(dashboard|courses|my-courses|profile|manage-courses|users|settings|analytics|security-audit|enrollments|notifications|calendar|resources)/;
const PUBLIC_PATHS = ['/', '/about']; // sign-in and sign-up are handled separately

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');

  // Allow static files, image optimization, and uploads to pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/videos') || // <-- CORRECCIÓN: Añadido para permitir videos
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  const isAppRoute = IS_APP_ROUTE_REGEX.test(pathname);
  const isAuthRoute = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');

  // If user has a session cookie
  if (sessionCookie) {
    // If they are on an auth page, redirect to dashboard
    if (isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Otherwise, allow the request to proceed
    return NextResponse.next();
  }

  // If user does not have a session cookie
  if (!sessionCookie) {
    // And they are trying to access a protected app route
    if (isAppRoute) {
      // Redirect to sign-in page, preserving the intended destination
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Allow all other requests (public pages, public API routes, etc.)
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except for static files and image optimization
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
