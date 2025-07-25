
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/auth';

const PUBLIC_PATHS = ['/sign-in', '/sign-up'];
const API_AUTH_PREFIX = '/api/auth';
const PROTECTED_ROUTE_PREFIX = '/dashboard'; // O la ruta principal de tu app

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and internal Next.js requests to pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/uploads') ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  // getSession is lightweight and safe for the Edge runtime
  const session = await getSession(request);
  
  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  const isApiAuthRoute = pathname.startsWith(API_AUTH_PREFIX);

  // If the user has a valid session
  if (session) {
    // If they are trying to access a public-only path (like login), redirect to dashboard
    if (isPublicPath) {
      return NextResponse.redirect(new URL(PROTECTED_ROUTE_PREFIX, request.url));
    }
    // Otherwise, allow the request
    return NextResponse.next();
  }

  // If the user does NOT have a session
  // and is trying to access a protected route (not public, not API auth)
  if (!session && !isPublicPath && !isApiAuthRoute) {
    // For API routes, return a 401 Unauthorized error
    if (pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    
    // For pages, redirect to the sign-in page, preserving the intended destination
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If none of the above conditions are met (e.g., accessing a public path without a session),
  // allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  // Match all paths except for the ones that are explicitly for static assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
