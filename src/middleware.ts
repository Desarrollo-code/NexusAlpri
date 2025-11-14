// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTE_PREFIXES = ['/dashboard', '/profile', '/manage-courses', '/my-courses', '/my-notes', '/resources', '/announcements', '/calendar', '/forms', '/enrollments', '/analytics', '/security-audit', '/settings', '/notifications', '/leaderboard', '/messages', '/quizz-it', '/processes'];
const PROTECTED_API_PREFIXES = ['/api/users', '/api/courses', '/api/enrollments', '/api/progress', '/api/notes', '/api/security', '/api/settings'];
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

  // REGLA 3: Para todos los demás casos, permitir.
  return NextResponse.next();
}

export const config = {
  // El middleware solo se ejecutará en las rutas de la aplicación y de la API,
  // excluyendo las rutas de Next.js (_next), los archivos estáticos y las rutas de autenticación de la API.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.png).*)'],
};