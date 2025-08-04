
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

const PUBLIC_PATHS = ['/', '/about', '/sign-in', '/sign-up'];
const PROTECTED_ROUTE_PREFIX = '/dashboard';
const API_AUTH_PREFIX = '/api/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSession(request);

  // Allow static files and image optimization to pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/uploads') ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_PATHS.some(p => pathname.startsWith(p) && (p === '/' ? pathname.length === 1 : true));
  const isApiAuthRoute = pathname.startsWith(API_AUTH_PREFIX);
  const isAppRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/courses') || pathname.startsWith('/profile');


  if (session) {
    // If logged in, redirect from public auth pages to dashboard
    if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
      return NextResponse.redirect(new URL(PROTECTED_ROUTE_PREFIX, request.url));
    }
    return NextResponse.next();
  }

  // If not logged in and trying to access a protected route
  if (!session && !isPublicRoute && !isApiAuthRoute) {
    if (pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    
    // Redirect to sign-in page, preserving the intended destination
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except for static files and image optimization
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
