// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers'; // Importa cookies directamente aquí

// Esto es solo un placeholder, no uses el getCurrentUser de lib/auth en middleware
// Si necesitas autenticación avanzada en middleware, considera JWTs simples o NextAuth.js
// o las opciones de Prisma Edge Runtime.
// Aquí solo verificamos si la cookie de sesión existe.

const PUBLIC_PATHS = ['/sign-in', '/sign-up'];
const API_PREFIX = '/api';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Si la ruta es pública, permitimos el acceso sin autenticación
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Verificar la cookie de sesión en el middleware
  const sessionCookieValue = request.cookies.get('session')?.value;

  // Si no hay cookie de sesión y la ruta no es una API de auth pública,
  // o si es una API protegida y no hay sesión, redirigir a /sign-in
  if (!sessionCookieValue && !pathname.startsWith('/api/auth/')) {
    // Si es una API Route protegida, retornar 401
    if (pathname.startsWith(API_PREFIX)) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    // Si es una página protegida, redirigir al login
    const signInUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Permitir el paso si hay sesión o si la ruta es una API de autenticación.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /api/auth (authentication API routes, handled separately or bypass middleware if needed)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};