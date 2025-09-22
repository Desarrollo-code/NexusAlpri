import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { cache } from 'react';
import type { User as PrismaUser } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fallback to a value derived from DATABASE_URL if JWT_SECRET is not set.
// This ensures functionality in environments like Render's free tier
// where setting many environment variables can be cumbersome.
const secretKey = process.env.JWT_SECRET || process.env.DATABASE_URL;

if (!secretKey) {
  // This will now only fail if neither JWT_SECRET nor DATABASE_URL are set.
  throw new Error('La variable de entorno JWT_SECRET o DATABASE_URL debe estar configurada.');
}
const key = new TextEncoder().encode(secretKey);

interface JWTPayload {
  userId: string;
  expires: Date;
}

async function encrypt(payload: JWTPayload): Promise<string> {
  const jwtPayload: Record<string, unknown> = {
    userId: payload.userId,
    expires: payload.expires.toISOString(),
  };
  return await new SignJWT({ payload: jwtPayload }) // ENCAPSULAMOS DENTRO DE 'payload'
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, { algorithms: ['HS256'] });
    // DEBEMOS BUSCAR DENTRO DEL OBJETO 'payload'
    return payload.payload;
  } catch (error) {
    // Log the specific error for better debugging in production logs
    console.error("Error decrypting JWT:", error);
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
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) {
    return null;
  }

  const session = await decrypt(sessionCookie);
  if (!session?.userId) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    // If a user is found, make sure they are active before returning
    if (user && !user.isActive) {
        return null; // Treat inactive users as if they are not logged in
    }

    return user || null;
  } catch (error) {
    console.error("Error al obtener el usuario desde la base de datos:", error);
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
