// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserIdFromSession } from './lib/auth'; // Usamos la nueva función segura para el Edge

const PROTECTED_ROUTE_PREFIXES = ['/dashboard', '/profile', '/manage-courses', '/my-courses', '/my-notes', '/resources', '/announcements', '/calendar', '/forms', '/enrollments', '/analytics', '/security-audit', '/settings', '/notifications', '/leaderboard', '/messages', '/quizz-it', '/processes', '/roadmap'];
const AUTH_ROUTE_PREFIXES = ['/sign-in', '/sign-up'];
const ADMIN_ONLY_ROUTES = ['/analytics', '/security-audit', '/settings', '/users', '/processes'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const userId = await getUserIdFromSession();
  const hasSession = !!userId;

  const isAuthRoute = AUTH_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));

  // --- REGLA 1: Si el usuario tiene sesión y va a una ruta de autenticación, lo redirigimos al dashboard. ---
  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // --- REGLA 2: Si el usuario NO tiene sesión y va a una ruta protegida, lo redirigimos al login, AÑADIENDO el parámetro de redirección. ---
  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));
  if (!hasSession && isProtectedRoute) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // --- REGLA 3: Si tiene sesión pero intenta acceder a rutas de admin sin serlo, lo redirigimos. ---
  // Esta comprobación es básica. La comprobación robusta se debe hacer en el componente de página o API route.
  // Para eso, necesitamos el rol del usuario, que SÍ requiere una consulta a la DB, por lo que esa lógica no puede vivir aquí.
  // Dejamos la puerta abierta para que el frontend haga la verificación final.
  
  // Si ninguna regla se cumple, permitir el acceso.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.png).*)'],
};
