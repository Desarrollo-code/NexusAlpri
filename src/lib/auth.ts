// src/lib/auth.ts
import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { User as PrismaUser } from '@prisma/client';
import prisma from './prisma';

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error('La variable de entorno JWT_SECRET no está configurada.');
}
const key = new TextEncoder().encode(secretKey);

interface JWTPayload {
  userId: string;
  // guardamos expires como ISO string en el payload por conveniencia
  expires?: string;
}

/** Crea y firma un JWT con claim { userId, expires }.
 *  La expiración real del token se establece con setExpirationTime.
 */
async function encrypt(payload: { userId: string; expires: Date }): Promise<string> {
  const jwtPayload: Record<string, unknown> = {
    userId: payload.userId,
    expires: payload.expires.toISOString(),
  };

  return await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // la expiración del token en 7 días
    .sign(key);
}

/** Verifica y decodifica el token. Devuelve { userId, expires: Date } o null. */
async function decrypt(input: string): Promise<{ userId: string; expires?: Date } | null> {
  try {
    const { payload } = await jwtVerify(input, key, { algorithms: ['HS256'] });

    const userId = typeof payload['userId'] === 'string' ? payload['userId'] : undefined;
    if (!userId) return null;

    // extraemos "expires" si existe (puede ser string ISO o exp numérico)
    let expiresDate: Date | undefined;
    const rawExpires = payload['expires'];
    if (typeof rawExpires === 'string') {
      const d = new Date(rawExpires);
      if (!Number.isNaN(d.getTime())) expiresDate = d;
    } else if (typeof payload['exp'] === 'number') {
      // exp en JWT es timestamp en segundos
      expiresDate = new Date(payload['exp'] * 1000);
    }

    // jwtVerify ya fallará si el token expiró, pero hacemos una comprobación extra por si acaso:
    if (expiresDate && expiresDate.getTime() < Date.now()) return null;

    return { userId, expires: expiresDate };
  } catch (error) {
    // token inválido/expirado/etc.
    // no arrojar para no romper la ruta; devolvemos null y el llamador tratará como "no autenticado"
    console.error('[auth.decrypt] token inválido o verificación falló:', error);
    return null;
  }
}

/** Crea la sesión (cookie con JWT). */
export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días desde ahora
  const session = await encrypt({ userId, expires });

  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // en segundos
    path: '/',
    sameSite: 'lax',
  });

  return session; // opcional: puede servir para pruebas
}

/** Elimina la sesión (cookie). */
export async function deleteSession() {
  const cookieStore = await cookies();

  // preferible borrar la cookie en vez de setearla vacía
  if (typeof cookieStore.delete === 'function') {
    cookieStore.delete('session');
  } else {
    // fallback para entornos que no expongan delete()
    cookieStore.set('session', '', { expires: new Date(0), path: '/' });
  }
}

/** Obtiene el usuario actual leyendo la cookie y validando el JWT.
 *  NO usa cache() para evitar resultados obsoletos tras login/logout en la misma ejecución.
 */
export async function getCurrentUser(): Promise<PrismaUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) return null;

    const session = await decrypt(sessionCookie);
    if (!session?.userId) return null;

    // Si tu id en Prisma es number, conviértelo aquí: const userId = Number(session.userId)
    const user = await prisma.user.findUnique({
      where: { id: session.userId as any }, // ajusta `as any` si tu tipo de id es number -> Number(...)
    });

    return user ?? null;
  } catch (error) {
    console.error('[auth.getCurrentUser] Error al obtener usuario:', error);
    return null;
  }
}
