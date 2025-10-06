import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { cache } from 'react';
import type { User as PrismaUser } from '@prisma/client';
import prisma from '@/lib/prisma';

// IMPORTANT: JWT_SECRET is the single source of truth for the secret key.
const secretKey = process.env.JWT_SECRET;

if (!secretKey) {
  // This will now only fail if JWT_SECRET is not set.
  throw new Error('La variable de entorno JWT_SECRET debe estar configurada.');
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
    // console.error("Error decrypting JWT:", error);
    return null;
  }
}

export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({ userId, expires });
  
  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    path: '/',
    sameSite: 'lax',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.set('session', '', { expires: new Date(0), path: '/' });
}

export const getUserFromSession = cache(async (): Promise<PrismaUser | null> => {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return null;
    }

    const session = await decrypt(sessionCookie);
    if (!session?.userId) {
      return null;
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (user && !user.isActive) {
        return null;
    }

    return user || null;
  } catch (error) {
    // If any error occurs (e.g., DB down), we can't get the user.
    // This is safer than letting the error propagate.
    console.error("Error in getUserFromSession, returning null:", error);
    return null;
  }
});


export async function getCurrentUser() {
    try {
        return await getUserFromSession();
    } catch(error) {
        console.error("Error in getCurrentUser, likely DB connection issue:", error);
        return null;
    }
}
