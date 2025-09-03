// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTE_REGEX = /^\/(dashboard|courses|my-courses|profile|manage-courses|users|settings|analytics|security-audit|enrollments|notifications|calendar|resources|my-notes)/;
const AUTH_ROUTES = ['/sign-in', '/sign-up'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');

  // Allow static files, image optimization, and uploads to pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/uploads') || // <-- AÑADIDO: Esta es la línea clave que permite el acceso a las imágenes.
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  // Allow the 2FA page to be accessed without a session
  if (pathname.startsWith('/sign-in/2fa')) {
      return NextResponse.next();
  }

  const isProtectedRoute = PROTECTED_ROUTE_REGEX.test(pathname);
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

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
    if (isProtectedRoute) {
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
