// src/lib/auth.ts
import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { cache } from 'react';
import type { User as PrismaUser } from '@prisma/client';
import prisma from './prisma';
import type { NextRequest } from 'next/server';

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error('La variable de entorno JWT_SECRET no está configurada.');
}
const key = new TextEncoder().encode(secretKey);

interface JWTPayload {
  userId: string;
  expires: Date;
}

async function encrypt(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, { algorithms: ['HS256'] });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({ userId, expires });

<<<<<<< HEAD
  // Set the cookie
=======
  // CORRECCIÓN: cookies() es dinámico. No se necesita 'await' aquí
  // porque .set() es síncrono después de obtener el objeto cookies.
  // Pero lo importante es que el runtime lo reconozca como una operación dinámica.
  // cookies().set(...) ya es la forma correcta. El problema era en getSession y getCurrentUser.
>>>>>>> 024f604c679bbffbbce169398715690c823527ed
  cookies().set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    path: '/',
    sameSite: 'lax',
  });
}

export async function deleteSession() {
  // CORRECCIÓN: Similar a createSession, cookies().set(...) es la forma correcta.
  cookies().set('session', '', { expires: new Date(0), path: '/' });
}

<<<<<<< HEAD
// Used in middleware where the full request object is available
=======
// Nota: getSession es llamado con 'request.cookies.get', lo cual es un acceso directo
// al objeto de cookies de la petición, que ya es un objeto 'Headers' y no necesita 'await cookies()'.
// Por lo tanto, esta función está bien tal cual.
>>>>>>> 024f604c679bbffbbce169398715690c823527ed
export async function getSession(request: NextRequest): Promise<{ userId: string } | null> {
    const sessionCookieValue = request.cookies.get('session')?.value;
    if (!sessionCookieValue) {
        return null;
    }
    const decryptedSession = await decrypt(sessionCookieValue);
    if (!decryptedSession?.userId) {
        return null;
    }
    return { userId: decryptedSession.userId };
}


// Used in API routes and server components. `cache` ensures this only runs once per request.
export const getCurrentUser = cache(async (): Promise<PrismaUser | null> => {
<<<<<<< HEAD
  const sessionCookieValue = cookies().get('session')?.value;
=======
  // CORRECCIÓN CLAVE DEFINITIVA: Forzar el 'await' explícito en la llamada a 'cookies()'.
  const sessionCookieValue = (await cookies()).get('session')?.value; 
>>>>>>> 024f604c679bbffbbce169398715690c823527ed

  if (!sessionCookieValue) {
    return null;
  }

  const session = await decrypt(sessionCookieValue);
  if (!session?.userId) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    return user || null;
  } catch (error) {
    console.error("Error al obtener el usuario desde la base de datos:", error);
    return null;
  }
});