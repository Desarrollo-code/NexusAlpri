
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { User } from '@/types';
import prisma from './prisma'; // Import prisma client

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
    return null;
  }
}

export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, expires });

  cookies().set('session', session, { 
    expires, 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    path: '/' 
  });
}

export async function getSession(request?: NextRequest) {
  const cookieStore = request ? request.cookies : cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) return null;
  
  return await decrypt(sessionCookie);
}

export async function getCurrentUser(): Promise<User | null> {
    const session = await getSession();
    if (!session || !session.userId) return null;

    if (new Date(session.expires) < new Date()) {
        return null;
    }

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
