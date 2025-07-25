
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

/**
 * @interface JWTPayload
 * Define la estructura de los datos que se codificarán dentro del token JWT.
 */
interface JWTPayload {
  userId: string;
  expires: Date;
}

/**
 * Cifra el payload del JWT y devuelve el token firmado.
 * @param payload - Los datos a incluir en el token.
 * @returns El token JWT como una cadena de texto.
 */
async function encrypt(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

/**
 * Descifra un token JWT y devuelve su payload.
 * @param input - El token JWT a descifrar.
 * @returns El payload del token, o null si el token es inválido.
 */
async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, { algorithms: ['HS256'] });
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Crea una sesión para un usuario, generando un token JWT y estableciéndolo en una cookie httpOnly.
 * @param userId - El ID del usuario para el que se crea la sesión.
 */
export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await encrypt({ userId, expires });

  cookies().set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
  });
}

/**
 * Elimina la cookie de sesión del navegador, cerrando la sesión del usuario.
 */
export async function deleteSession() {
  cookies().set('session', '', { expires: new Date(0), path: '/' });
}


/**
 * **Función solo para Middleware (Edge Runtime).**
 * Obtiene la sesión a partir de la cookie en el objeto `NextRequest`.
 * Es ligera y no consulta la base de datos.
 * @param request - El objeto NextRequest del middleware.
 * @returns Un objeto con el userId si la sesión es válida, o null si no lo es.
 */
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


/**
 * **Función para Rutas de API y Componentes de Servidor (Node.js Runtime).**
 * Obtiene los datos completos del usuario autenticado actualmente.
 * Utiliza 'next/headers' para acceder a las cookies y `cache` para memorizar el resultado.
 * @returns El objeto de usuario completo si está autenticado, o null si no lo está.
 */
export const getCurrentUser = cache(async (): Promise<PrismaUser | null> => {
  const sessionCookieValue = cookies().get('session')?.value;

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
