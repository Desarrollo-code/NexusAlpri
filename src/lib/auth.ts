
// src/lib/auth.ts
import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { User as PrismaUser } from '@prisma/client';
import prisma from './prisma';
import { cache } from 'react';

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error('La variable de entorno JWT_SECRET no está configurada.');
}
const key = new TextEncoder().encode(secretKey);

// ================================
// Crear sesión con JWT
// ================================
export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
  const session = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);

  // Correctly get the cookie store instance first
  const cookieStore = cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires,
    sameSite: 'lax',
    path: '/',
  });
}

// ================================
// Obtener usuario desde la sesión
// ================================
export const getUserFromSession = cache(async (): Promise<PrismaUser | null> => {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(sessionCookie, key, { algorithms: ['HS256'] });
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
    });
    return user;
  } catch (error) {
    console.error('Error al verificar la sesión:', error);
    return null;
  }
});

// ================================
// Alias para compatibilidad - FIX: Export this function
// ================================
export async function getCurrentUser(): Promise<PrismaUser | null> {
  return await getUserFromSession();
}

// ================================
// Cerrar sesión
// ================================
export async function deleteSession() {
  const cookieStore = cookies();
  cookieStore.set('session', '', { expires: new Date(0), path: '/' });
}

// ================================
// Alias para el logout, manteniendo consistencia
// ================================
export async function signOut() {
  await deleteSession();
}
