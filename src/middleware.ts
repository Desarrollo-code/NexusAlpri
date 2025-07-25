
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

const PUBLIC_PATHS = ['/sign-in', '/sign-up'];
const API_PREFIX = '/api';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Early exit for static files and internal Next.js assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/uploads') ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }
  
  // API routes are handled by their own logic, not redirected by middleware.
  if (pathname.startsWith(API_PREFIX)) {
    return NextResponse.next();
  }

  // Pass the request to getSession, making it Edge-compatible
  const session = await getSession(request);
  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  // If user is logged in
  if (session?.userId) {
    // If they try to access a public-only path (like sign-in), redirect to dashboard
    if (isPublicPath) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Allow access to all other (protected) routes
    return NextResponse.next();
  }

  // If user is NOT logged in
  if (!session?.userId && !isPublicPath) {
    // And tries to access a protected path, redirect them to sign-in
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  // Allow access to public paths for non-logged-in users
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * This ensures the middleware runs on all pages and API routes.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
