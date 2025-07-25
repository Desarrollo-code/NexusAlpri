
// src/lib/auth.ts

import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { cache } from 'react';
import type { User } from '@prisma/client';
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
 * Encripta un payload para crear un token JWT.
 */
async function encrypt(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

/**
 * Desencripta y valida un token JWT.
 */
async function decrypt(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Crea una sesión de usuario estableciendo una cookie segura y httpOnly.
 * Esta función debe ser llamada únicamente desde el lado del servidor.
 */
export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Expira en 7 días
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
 * Elimina la cookie de sesión para cerrar la sesión del usuario.
 */
export async function deleteSession() {
  cookies().set('session', '', { expires: new Date(0), path: '/' });
}

/**
 * [SOLO PARA MIDDLEWARE] Obtiene la sesión desde la cookie de la solicitud.
 * Es una función ligera diseñada para el Edge Runtime, ya que no accede a la base de datos.
 */
export async function getSession(request: NextRequest): Promise<JWTPayload | null> {
    const sessionCookieValue = request.cookies.get('session')?.value;
    if (!sessionCookieValue) {
        return null;
    }
    return await decrypt(sessionCookieValue);
}

/**
 * Obtiene los datos completos del usuario autenticado actualmente.
 * Utiliza React.cache para evitar consultas duplicadas a la base de datos en una misma solicitud.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const requestCookies = cookies();
  const sessionCookieValue = requestCookies.get('session')?.value;

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

    if (!user) return null;

    const { password, twoFactorSecret, ...safeUser } = user;
    return safeUser as User;

  } catch (error) {
    console.error("Error al obtener el usuario desde la base de datos:", error);
    return null;
  }
});
