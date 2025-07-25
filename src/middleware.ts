// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth'; // Importamos la función correcta

const PUBLIC_PATHS = ['/sign-in', '/sign-up'];
const API_PREFIX = '/api';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Si la ruta es pública, permitimos el acceso sin autenticación
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Si la ruta es una API y no es de autenticación, la manejamos aquí
  if (pathname.startsWith(API_PREFIX) && !pathname.startsWith('/api/auth')) {
    // Para rutas API, necesitamos verificar la sesión.
    // Usamos getCurrentUser, que es la función correcta.
    const user = await getCurrentUser();

    if (!user) {
      // Si no hay usuario, negamos el acceso a la API
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    // Si hay usuario, permitimos el paso a la API
    return NextResponse.next();
  }

  // Para rutas de página (no API y no públicas)
  // Verificamos si el usuario está autenticado para acceder a páginas protegidas.
  const user = await getCurrentUser(); // Usamos la función correcta aquí también

  if (!user) {
    // Si no hay usuario, redirigimos a la página de inicio de sesión
    const signInUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Si el usuario está autenticado y la ruta no es pública, permitimos el acceso.
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