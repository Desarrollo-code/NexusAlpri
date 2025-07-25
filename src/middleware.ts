// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

const PUBLIC_PATHS = ['/sign-in', '/sign-up'];
const API_AUTH_PREFIX = '/api/auth';
const PROTECTED_ROUTE_PREFIX = '/dashboard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSession(request);

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

  if (session) {
    if (isPublicPath) {
      return NextResponse.redirect(new URL(PROTECTED_ROUTE_PREFIX, request.url));
    }
    return NextResponse.next();
  }

  if (!session && !isPublicPath && !isApiAuthRoute) {
    if (pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
