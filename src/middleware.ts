import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

const PUBLIC_PATHS = ['/sign-in', '/sign-up'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSession(request);

  // Check if the path is for static files or API routes and let them pass
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  // If user is logged in
  if (session) {
    // If they try to access a public-only path (like sign-in), redirect to dashboard
    if (isPublicPath) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Otherwise, allow access to protected routes
    return NextResponse.next();
  }

  // If user is not logged in
  if (!session && !isPublicPath) {
    // If they try to access a protected route, redirect to sign-in
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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
