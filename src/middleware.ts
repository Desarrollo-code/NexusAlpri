// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que se consideran públicas y no requieren autenticación.
// Todas las demás rutas, por defecto, se considerarán protegidas.
const PUBLIC_ROUTES = ['/', '/about', '/sign-in', '/sign-up', '/sign-in/2fa'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');

  const isPublicRoute = PUBLIC_ROUTES.some(path => {
    if (path.endsWith('/')) {
        return pathname === path;
    }
    return pathname.startsWith(path);
  });

  // REGLA 1: Usuario con sesión intentando acceder a una ruta pública (que no sea la landing page)
  if (sessionCookie && isPublicRoute && pathname !== '/') {
      // Excepción para la página "about"
      if (pathname.startsWith('/about')) {
          return NextResponse.next();
      }
      // Redirige al dashboard si intenta ir a /sign-in, /sign-up, etc.
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // REGLA 2: Usuario SIN sesión intentando acceder a una ruta protegida
  if (!sessionCookie && !isPublicRoute) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirectedFrom', pathname); // Guardar la página a la que intentaba ir
      return NextResponse.redirect(signInUrl);
  }

  // REGLA 3: Para todos los demás casos, permitir que la solicitud continúe.
  // (Usuario con sesión en ruta protegida, o usuario sin sesión en ruta pública).
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
   matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads).*)'],
};
