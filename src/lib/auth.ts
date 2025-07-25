// src/lib/auth.ts
import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { cache } from 'react';
import type { User as PrismaUser } from '@prisma/client'; // Assuming User type from Prisma
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
 * Cifra un objeto de payload en un token JWT (string).
 * @param payload - Los datos a cifrar, que deben incluir el ID del usuario y la fecha de expiración.
 * @returns {Promise<string>} El token JWT como una cadena de texto.
 */
async function encrypt(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // El token expira en 7 días
    .sign(key);
}

/**
 * Descifra un token JWT para obtener el payload.
 * @param input - El token JWT (string) a descifrar.
 * @returns {Promise<any>} El payload del token o null si la verificación falla.
 */
async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, { algorithms: ['HS256'] });
    return payload;
  } catch (error) {
    // Esto puede ocurrir si el token es inválido, ha expirado, etc.
    console.error('Error al descifrar el token:', error);
    return null;
  }
}

/**
 * Crea una sesión para un usuario, estableciendo una cookie 'httpOnly' en el navegador.
 * @param userId - El ID del usuario para el que se crea la sesión.
 */
export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días desde ahora
  const token = await encrypt({ userId, expires });

  // WORKAROUND para el error "cookies() should be awaited" en Next.js/Turbopack
  const setCookie = async () => {
    cookies().set('session', token, {
      httpOnly: true, // Hace que la cookie no sea accesible por JavaScript en el navegador (mayor seguridad XSS)
      secure: process.env.NODE_ENV === 'production', // Solo envía la cookie sobre HTTPS en producción
      maxAge: 60 * 60 * 24 * 7, // Duración de la cookie: 7 días (en segundos)
      path: '/', // La cookie está disponible en todas las rutas de la aplicación
      sameSite: 'lax', // Protección moderada contra ataques CSRF
    });
  };
  await setCookie(); // Await de la función que llama a cookies().set()
}

/**
 * Elimina la sesión del usuario actual borrando la cookie de sesión.
 */
export async function deleteSession() {
  // WORKAROUND para el error "cookies() should be awaited" en Next.js/Turbopack
  const deleteCookie = async () => {
    cookies().set('session', '', { expires: new Date(0), path: '/' });
  };
  await deleteCookie(); // Await de la función que llama a cookies().set()
}

/**
 * Obtiene el usuario actualmente autenticado.
 * Esta función está diseñada para ser utilizada en API Routes y Server Components.
 * Utiliza 'cache' de React para evitar múltiples consultas a la base de datos en una misma petición.
 * @returns {Promise<PrismaUser | null>} El objeto del usuario si está autenticado, o null en caso contrario.
 */
export const getCurrentUser = cache(async (): Promise<PrismaUser | null> => {
  // WORKAROUND para el error "cookies() should be awaited" en Next.js/Turbopack
  const getCookieValue = async () => {
    const requestCookies = cookies();
    return requestCookies.get('session')?.value;
  };

  const sessionCookieValue = await getCookieValue(); // Await de la función que llama a cookies().get()

  // Si no hay una cookie de sesión, no hay usuario autenticado.
  if (!sessionCookieValue) {
    // console.log("getCurrentUser: No session cookie found."); // Puedes descomentar esto para depurar
    return null;
  }

  // Descifra la sesión para obtener el userId.
  const session = await decrypt(sessionCookieValue);
  if (!session?.userId) {
    // console.log("getCurrentUser: Session invalid or missing userId."); // Puedes descomentar esto para depurar
    return null;
  }

  // Busca al usuario en la base de datos.
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    // console.log("getCurrentUser: User fetched from DB:", user); // Puedes descomentar esto para depurar
    return user || null;
  } catch (error) {
    console.error("Error al obtener el usuario desde la base de datos:", error);
    return null;
  }
});

/**
 * Obtiene la sesión del usuario a partir de la cookie, para ser usado principalmente en el Middleware.
 * Esta función es más ligera que getCurrentUser porque no consulta la base de datos.
 * Es segura para usar en el Edge Runtime.
 * @param {NextRequest} [request] - El objeto de la petición, necesario en el middleware.
 * @returns {Promise<{ userId: string } | null>} Un objeto con el userId si la sesión es válida, o null.
 */
export async function getSession(request: NextRequest): Promise<{ userId: string } | null> {
  // No hay necesidad de workaround aquí ya que se usa request.cookies.get(), no directamente cookies() de next/headers
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