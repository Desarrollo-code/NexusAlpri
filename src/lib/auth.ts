
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { User } from '@/types';
import prisma from './prisma';
import { cache } from 'react';
import type { NextRequest } from 'next/server';

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.warn('JWT_SECRET is not set in environment variables. Using a default, insecure secret.');
}
const key = new TextEncoder().encode(secret || 'default-insecure-secret-for-dev');

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    // It's normal for tokens to expire, so we don't need to log this as an error.
    return null;
  }
}

export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, expires: expires.toISOString() });

  cookies().set('session', session, { 
    expires, 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    path: '/' 
  });
}

export async function deleteSession() {
  cookies().set('session', '', { expires: new Date(0), path: '/' });
}

/**
 * Lightweight session checker for middleware.
 * This is the ONLY function that should be used in middleware.
 * It only decrypts the cookie from the request object, it does NOT query the database.
 */
export async function getSession(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) return null;

  const decrypted = await decrypt(sessionCookie);

  if (!decrypted || new Date(decrypted.expires) < new Date()) {
      return null;
  }
  
  // Return only the essential parts for middleware checks
  return { userId: decrypted.userId };
}


/**
 * Fetches the full user object from the database based on the current session.
 * This is the primary function to use in server-side components and API routes
 * that are NOT running on the Edge.
 * Uses `cache` to prevent multiple DB queries for the same user in a single request.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
    const sessionCookieValue = cookies().get('session')?.value;
    if (!sessionCookieValue) {
        return null;
    }

    const sessionData = await decrypt(sessionCookieValue);
    if (!sessionData?.userId) {
        return null;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: sessionData.userId },
        });

        if (!user) return null;

        const { password, twoFactorSecret, ...safeUser } = user;
        return safeUser as User;

    } catch (error) {
        console.error("Error fetching user for session:", error);
        return null;
    }
});
