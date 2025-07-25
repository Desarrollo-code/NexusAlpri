
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

const PUBLIC_PATHS = ['/sign-in', '/sign-up'];
const API_PREFIX = '/api';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/uploads') ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }
  
  if (pathname.startsWith(API_PREFIX)) {
    return NextResponse.next();
  }

  // Pass the request object to getSession, making it Edge-compatible.
  const session = await getSession(request);
  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  if (session?.userId) {
    if (isPublicPath) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (!session?.userId && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
