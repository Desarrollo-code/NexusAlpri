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

export async function deleteSession() {
  cookies().set('session', '', { expires: new Date(0), path: '/' });
}

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

// Separate function specifically for middleware (Edge runtime compatible)
export async function getSessionFromMiddleware(request: NextRequest): Promise<{ userId: string } | null> {
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
