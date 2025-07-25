
// src/lib/auth.ts
import 'server-only'; // Asegura que este módulo solo se ejecute en el servidor.
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { User } from '@prisma/client';
import prisma from './prisma';
import React from 'react';

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error('JWT_SECRET is not set in environment variables.');
}
const key = new TextEncoder().encode(secretKey);

interface JWTPayload {
  userId: string;
  expires: Date;
}

// --- TOKEN ENCRYPTION/DECRYPTION ---

async function encrypt(payload: JWTPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

async function decrypt(input: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as JWTPayload;
  } catch (error) {
    // Esto puede ocurrir si el token es inválido o ha expirado.
    console.error('Failed to verify session token:', error);
    return null;
  }
}

// --- SESSION MANAGEMENT ---

/**
 * Creates a session by setting a secure, httpOnly cookie.
 * This function should only be called from server-side code (e.g., API routes, Server Actions).
 */
export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const sessionToken = await encrypt({ userId, expires });

  cookies().set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires,
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Deletes the session cookie.
 * This function should only be called from server-side code.
 */
export async function deleteSession() {
  cookies().set('session', '', { expires: new Date(0), path: '/' });
}

// --- USER/SESSION RETRIEVAL ---

/**
 * Retrieves the session from the request cookies.
 * This is the ONLY function that should be used in middleware.
 * It is lightweight and safe for the Edge runtime as it does NOT access the database.
 */
export async function getSession() {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;
  return await decrypt(sessionCookie);
}

/**
 * Fetches the full user object from the database based on the current session.
 * This is the primary function to use in server-side components and API routes.
 * It is wrapped in React.cache to prevent multiple DB queries for the same user in a single request.
 */
export const getCurrentUser = React.cache(async (): Promise<User | null> => {
  const session = await getSession();
  if (!session?.userId) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) return null;

    // IMPORTANT: Exclude sensitive fields before returning the user object.
    const { password, twoFactorSecret, ...safeUser } = user;
    return safeUser as User; // Assuming the rest of the fields match the User type without password/secret.

  } catch (error) {
    console.error("Error fetching user for session:", error);
    return null;
  }
});
