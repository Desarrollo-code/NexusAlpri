// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTE_PREFIXES = [
    '/dashboard', '/courses', '/my-courses', '/profile', 
    '/manage-courses', '/users', '/settings', '/analytics', 
    '/security-audit', '/enrollments', '/notifications', 
    '/calendar', '/resources', '/my-notes', '/forms'
];
// CORRECCIÓN: Añadir la ruta explícita de 2FA
const AUTH_ROUTE_PREFIXES = ['/sign-in', '/sign-up'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');

  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));
  const isAuthRoute = AUTH_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));

  // 1. User has a session
  if (sessionCookie) {
    // If logged-in user tries to access an auth page, redirect to dashboard
    if (isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Otherwise, allow access
    return NextResponse.next();
  }

  // 2. User does not have a session
  if (!sessionCookie) {
    // If they try to access a protected route, redirect to sign-in
    if (isProtectedRoute) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // 3. For all other cases (e.g., public pages for non-logged-in users), allow access
  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - uploads (publicly uploaded content)
   */
   matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads).*)'],
};
