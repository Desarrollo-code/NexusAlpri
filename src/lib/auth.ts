
// src/lib/auth.ts

// --- IMPORTS ---
import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { cache } from 'react';
import type { User } from '@prisma/client';
import prisma from './prisma';
import type { NextRequest } from 'next/server';


// --- CONFIGURACIÓN DE SEGURIDAD ---

/**
 * Clave secreta para firmar los tokens JWT.
 * Se obtiene de las variables de entorno. Es crucial que esta variable esté definida.
 */
const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error('La variable de entorno JWT_SECRET no está configurada.');
}
const key = new TextEncoder().encode(secretKey);


// --- TIPOS Y ESTRUCTURAS DE DATOS ---

/**
 * @interface JWTPayload
 * Define la estructura de los datos que se codificarán dentro del token JWT.
 * @property {string} userId - El ID único del usuario.
 * @property {Date} expires - La fecha y hora de expiración del token.
 */
interface JWTPayload {
  userId: string;
  expires: Date;
}


// --- ENCRIPTACIÓN Y DESENCRIPTACIÓN DE TOKEN ---

/**
 * Encripta un payload para crear un token JWT.
 * @param payload - Los datos a encriptar, que deben cumplir con la interfaz JWTPayload.
 * @returns {Promise<string>} - El token JWT firmado.
 */
async function encrypt(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // El token expirará en 7 días.
    .sign(key);
}

/**
 * Desencripta y valida un token JWT.
 * @param token - El token JWT a verificar.
 * @returns {Promise<JWTPayload | null>} - El payload desencriptado o null si el token es inválido/expirado.
 */
async function decrypt(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    return payload as JWTPayload;
  } catch (error) {
    // Es normal que falle si el token es inválido o expiró.
    return null;
  }
}


// --- GESTIÓN DE SESIÓN ---

/**
 * Crea una sesión de usuario estableciendo una cookie segura y httpOnly.
 * Esta función debe ser llamada únicamente desde el lado del servidor.
 * @param userId - El ID del usuario para el cual se crea la sesión.
 */
export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Expira en 7 días
  const token = await encrypt({ userId, expires });

  // Accede a las cookies de la respuesta para establecer la cookie de sesión.
  cookies().set('session', token, {
    httpOnly: true, // Hace que la cookie no sea accesible por JavaScript en el navegador (mayor seguridad XSS)
    secure: process.env.NODE_ENV === 'production', // Solo envía la cookie sobre HTTPS en producción
    maxAge: 60 * 60 * 24 * 7, // Duración de la cookie: 7 días (en segundos)
    path: '/', // La cookie está disponible en todo el sitio
    sameSite: 'lax', // Protección moderada contra ataques CSRF
  });
}

/**
 * Elimina la cookie de sesión para cerrar la sesión del usuario.
 * Esta función debe ser llamada únicamente desde el lado del servidor.
 */
export async function deleteSession() {
  cookies().set('session', '', { expires: new Date(0), path: '/' });
}


// --- OBTENCIÓN DE DATOS DE USUARIO ---

/**
 * [SOLO PARA MIDDLEWARE] Obtiene la sesión desde la cookie de la solicitud.
 * Es una función ligera diseñada para el Edge Runtime, ya que no accede a la base de datos.
 * @param request - El objeto NextRequest, obligatorio en el middleware.
 * @returns {Promise<JWTPayload | null>} - El payload de la sesión o null si no existe/es inválido.
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
 * Esta es la función que debe usarse en API Routes y Server Components.
 * @returns {Promise<User | null>} - El objeto del usuario o null si no está autenticado.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  // Para obtener las cookies en un Server Component o API Route, se debe usar la función `cookies()` de `next/headers`.
  const requestCookies = cookies();
  const sessionCookieValue = requestCookies.get('session')?.value;

  // Si no hay una cookie de sesión, no hay usuario autenticado.
  if (!sessionCookieValue) {
    return null;
  }

  // Desencripta la cookie para obtener el payload.
  const session = await decrypt(sessionCookieValue);
  if (!session?.userId) {
    return null;
  }

  // Con el ID del usuario, busca los datos en la base de datos.
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) return null;

    // IMPORTANTE: Excluir campos sensibles antes de devolver el objeto de usuario.
    const { password, twoFactorSecret, ...safeUser } = user;
    return safeUser as User;

  } catch (error) {
    console.error("Error al obtener el usuario desde la base de datos:", error);
    return null;
  }
});
