
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/auth';

const PUBLIC_PATHS = ['/sign-in', '/sign-up'];
const API_AUTH_PREFIX = '/api/auth';
const PROTECTED_ROUTE_PREFIX = '/dashboard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and internal Next.js requests to pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/uploads') ||
    pathname.match(/\.(.*)$/)
  ) {
    return NextResponse.next();
  }

  // getSession es ligero y seguro para el Edge runtime
  const session = await getSession(request);
  
  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  const isApiAuthRoute = pathname.startsWith(API_AUTH_PREFIX);

  // Si el usuario tiene una sesión válida
  if (session) {
    // Si intenta acceder a una ruta pública (como /sign-in), redirigir al dashboard
    if (isPublicPath) {
      return NextResponse.redirect(new URL(PROTECTED_ROUTE_PREFIX, request.url));
    }
    // De lo contrario, permitir la solicitud
    return NextResponse.next();
  }

  // Si el usuario NO tiene sesión y está tratando de acceder a una ruta protegida
  if (!session && !isPublicPath && !isApiAuthRoute) {
    // Para rutas de API, devolver un error 401
    if (pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    
    // Para páginas, redirigir al login, preservando la URL original
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Si no se cumple ninguna de las condiciones anteriores (ej. acceso a ruta pública sin sesión), permitir
  return NextResponse.next();
}

export const config = {
  // Match all paths except for the ones that are explicitly for static assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
