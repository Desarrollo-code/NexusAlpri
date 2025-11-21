// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCurrentUser } from './lib/auth'; // Importamos la función de sesión

const PROTECTED_ROUTE_PREFIXES = ['/dashboard', '/profile', '/manage-courses', '/my-courses', '/my-notes', '/resources', '/announcements', '/calendar', '/forms', '/enrollments', '/analytics', '/security-audit', '/settings', '/notifications', '/leaderboard', '/messages', '/quizz-it', '/processes', '/roadmap'];
const AUTH_ROUTE_PREFIXES = ['/sign-in', '/sign-up'];
const ADMIN_ONLY_ROUTES = ['/analytics', '/security-audit', '/settings', '/users', '/processes'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Usamos la nueva función para obtener el usuario directamente.
  const user = await getCurrentUser();

  const isAuthRoute = AUTH_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));

  // --- REGLA 1: Si el usuario tiene sesión y va a una ruta de autenticación, lo redirigimos al dashboard. ---
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // --- REGLA 2: Si el usuario NO tiene sesión y va a una ruta protegida, lo redirigimos al login, AÑADIENDO el parámetro de redirección. ---
  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));
  if (!user && isProtectedRoute) {
    const signInUrl = new URL('/sign-in', request.url);
    // **LA CORRECCIÓN CLAVE ESTÁ AQUÍ**
    signInUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // --- REGLA 3: Si el usuario TIENE sesión, verificamos permisos granulares y de rol. ---
  if (user && isProtectedRoute) {
      // 3a. Permisos de Administrador
      const isAdminRoute = ADMIN_ONLY_ROUTES.some(prefix => pathname.startsWith(prefix));
      if (isAdminRoute && user.role !== 'ADMINISTRATOR') {
          return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
      }

      // 3b. Permisos granulares personalizados
      if (user.customPermissions && user.customPermissions.length > 0) {
          const hasAccess = user.customPermissions.some(allowedPath => pathname.startsWith(allowedPath));
          if (!hasAccess) {
              // El usuario tiene permisos personalizados, pero esta ruta no está en su lista.
              // Podríamos redirigir a una página de "acceso denegado" o de vuelta al dashboard.
              return NextResponse.redirect(new URL('/dashboard?error=denied', request.url));
          }
      }
  }

  // Si ninguna regla se cumple, permitir el acceso.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.png).*)'],
};
