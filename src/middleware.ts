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
  const isProtectedApiRoute = PROTECTED_API_PREFIXES.some(prefix => pathname.startsWith(prefix));
  const isAuthRoute = AUTH_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));

  // REGLA 1: Usuario con sesión intentando acceder a una ruta de autenticación
  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // REGLA 2: Usuario SIN sesión intentando acceder a una ruta protegida
  if (!sessionCookie && (isProtectedRoute || isProtectedApiRoute)) {
    // Si la petición es a una API, devolvemos un error 401 en JSON en lugar de redirigir.
    if (pathname.startsWith('/api/')) {
        return new NextResponse(
            JSON.stringify({ success: false, message: 'Autenticación requerida' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    // Si es una página, redirigimos al login.
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // REGLA 3: Para todos los demás casos, permitir.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|uploads|certificates|.*\\..*).*)'],
};
