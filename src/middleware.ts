
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/sign-in', '/sign-up'];
const API_AUTH_PREFIX = '/api/auth';
const PROTECTED_ROUTE_PREFIX = '/dashboard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');

  // Allow static files and internal Next.js requests to pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/uploads') ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  const isApiAuthRoute = pathname.startsWith(API_AUTH_PREFIX);

  // If the user has a session cookie
  if (sessionCookie) {
    // If they try to access a public path, redirect to the dashboard
    if (isPublicPath) {
      return NextResponse.redirect(new URL(PROTECTED_ROUTE_PREFIX, request.url));
    }
    // Otherwise, allow the request
    return NextResponse.next();
  }

  // If the user does NOT have a session and is trying to access a protected route
  if (!sessionCookie && !isPublicPath && !isApiAuthRoute) {
    // For API routes, return a 401 error
    if (pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    
    // For pages, redirect to the login page, preserving the original URL
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If none of the above conditions are met (e.g., accessing a public path without a session), allow the request.
  return NextResponse.next();
}

export const config = {
  // Match all paths except for the ones that are explicitly for static assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
