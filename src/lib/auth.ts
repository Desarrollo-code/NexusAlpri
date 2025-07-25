
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { User } from '@/types';
import prisma from './prisma';
import { cache } from 'react';

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
    console.log('Failed to verify session token, it may have expired.');
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
 * Only decrypts the cookie, does NOT query the database.
 * This is safe for the Edge runtime.
 */
export async function getSession() {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) return null;
  
  const decrypted = await decrypt(sessionCookie);
  if (!decrypted || new Date(decrypted.expires) < new Date()) {
      cookies().set('session', '', { expires: new Date(0), path: '/' }); // Clear expired cookie
      return null;
  }
  
  return decrypted;
}

/**
 * Fetches the full user object from the database based on the current session.
 * This is the primary function to use in server-side components and API routes
 * that are NOT running on the Edge.
 * Uses `cache` to prevent multiple DB queries for the same user in a single request.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
    const sessionData = await getSession();
    if (!sessionData?.userId) return null;

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
