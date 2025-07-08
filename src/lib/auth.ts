
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { User } from '@/types';

const secret = process.env.JWT_SECRET;
if (!secret) {
  // In a real app, you'd want to throw an error here or have a fallback.
  // For this context, we'll log a warning and proceed with a default, insecure secret.
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
    // This can happen if the token is expired or malformed
    return null;
  }
}

export async function createSession(user: Partial<User>) {
  // Ensure we don't leak password hash or other sensitive data
  const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
  };
  
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ user: userPayload, expires: expires.toISOString() });

  const cookieStore = cookies();
  cookieStore.set('session', session, { expires, httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });
}

export async function getSession(request?: NextRequest) {
  const cookieStore = request ? request.cookies : cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return null;
  }

  const decryptedSession = await decrypt(sessionCookie);

  if (!decryptedSession) {
    return null;
  }
  
  if (new Date(decryptedSession.expires) < new Date()) {
      // The session is expired and will be treated as null.
      // The client will be redirected by the middleware.
      return null;
  }

  return decryptedSession.user as User;
}

export async function deleteSession() {
  const cookieStore = cookies();
  cookieStore.set('session', '', { expires: new Date(0), path: '/' });
}
