import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

const protectedRoutes = ['/dashboard', '/courses', '/my-courses', '/profile', '/settings', '/resources', '/announcements', '/calendar', '/enrollments', '/manage-courses'];
const publicRoutes = ['/sign-in', '/sign-up', '/api/auth/login', '/api/auth/logout'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    const session = await getSession(request);
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = '/sign-in';
      url.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth/register|api/settings|_next/static|_next/image|favicon.ico|uploads).*)'],
};
