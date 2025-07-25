
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { User } from '@/types';
import prisma from './prisma';

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
    // This can happen if the token is invalid or expired
    return null;
  }
}

export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  // Only store the userId in the session payload
  const session = await encrypt({ userId, expires: expires.toISOString() });

  cookies().set('session', session, { 
    expires, 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    path: '/' 
  });
}

/**
 * Lightweight session checker for middleware.
 * Only decrypts the cookie, does NOT query the database.
 * Use this in Edge runtime environments.
 */
export async function getSession(request?: NextRequest) {
  const cookieStore = request ? request.cookies : cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) return null;
  
  const decrypted = await decrypt(sessionCookie);
  if (!decrypted || new Date(decrypted.expires) < new Date()) {
      return null;
  }
  
  return decrypted; // Returns { userId, iat, exp, expires }
}

/**
 * Fetches the full user object from the database based on the current session.
 * This is a server-only function and should not be used in middleware.
 */
export async function getCurrentUser(): Promise<User | null> {
    const session = await getSession();
    if (!session || !session.userId) return null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (!user) return null;

        const { password, twoFactorSecret, ...safeUser } = user;
        return safeUser as User;

    } catch (error) {
        console.error("Error fetching user for session:", error);
        return null;
    }
}


export async function deleteSession() {
  cookies().set('session', '', { expires: new Date(0), path: '/' });
}
