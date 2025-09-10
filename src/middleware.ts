// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTE_PREFIXES = ['/dashboard', '/profile', '/manage-courses', '/my-courses', '/my-notes', '/resources', '/announcements', '/calendar', '/forms', '/enrollments', '/analytics', '/security-audit', '/settings', '/notifications'];
const AUTH_ROUTE_PREFIXES = ['/sign-in', '/sign-up'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');

  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));
  const isAuthRoute = AUTH_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));

  // REGLA 1: Usuario con sesión intentando acceder a una ruta de autenticación
  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // REGLA 2: Usuario SIN sesión intentando acceder a una ruta protegida
  if (!sessionCookie && isProtectedRoute) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // REGLA 3: Para todos los demás casos (rutas públicas, o usuario con sesión en ruta protegida), permitir.
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
   matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\..*).*)'],
};
