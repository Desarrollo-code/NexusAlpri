// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTE_REGEX = /^\/(dashboard|courses|my-courses|profile|manage-courses|users|settings|analytics|security-audit|enrollments|notifications|calendar|resources|my-notes|forms)/;
const AUTH_ROUTES = ['/sign-in', '/sign-up'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');

  // Si el usuario tiene una sesión
  if (sessionCookie) {
    // Si intenta acceder a una página de autenticación, redirigir al dashboard
    if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Si no, permitir el acceso
    return NextResponse.next();
  }

  // Si el usuario NO tiene una sesión
  if (!sessionCookie) {
    // Y está intentando acceder a una ruta protegida
    if (PROTECTED_ROUTE_REGEX.test(pathname)) {
      // Redirigir a la página de inicio de sesión, guardando la URL original
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Para todas las demás peticiones (páginas públicas, etc.), permitir el paso
  return NextResponse.next();
}

export const config = {
  /*
   * Coincide con todas las rutas de petición EXCEPTO las que comienzan con:
   * - api (rutas de API)
   * - _next/static (archivos estáticos de Next.js)
   * - _next/image (archivos de optimización de imágenes)
   * - favicon.ico (el ícono de la pestaña)
   * - uploads (la carpeta pública con el contenido subido por el usuario)
   */
   matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\..*).*)'],
};
