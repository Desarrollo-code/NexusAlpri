// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// --- Rate Limiting Logic ---
const loginAttempts = new Map<string, { count: number; expiry: number }>();
const RATE_LIMIT_COUNT = 10; // Max attempts
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getIp(req: NextRequest) {
    return req.ip || req.headers.get('x-forwarded-for') || 'unknown';
}

function checkRateLimit(ip: string): boolean {
    const record = loginAttempts.get(ip);
    if (!record) return true; // No record, allow attempt

    // If window has expired, reset the record
    if (Date.now() > record.expiry) {
        loginAttempts.delete(ip);
        return true;
    }
    
    // Check if count exceeds the limit
    return record.count < RATE_LIMIT_COUNT;
}

function recordFailedAttempt(req: NextRequest, email: string, userId?: string) {
    const ip = getIp(req);
    // Record in-memory for rate limiting
    const record = loginAttempts.get(ip) || { count: 0, expiry: Date.now() + RATE_LIMIT_WINDOW_MS };
    record.count++;
    loginAttempts.set(ip, record);
    
    // Record in database for auditing
    prisma.securityLog.create({
        data: {
            event: 'FAILED_LOGIN_ATTEMPT',
            ipAddress: ip,
            emailAttempt: email,
            userId: userId,
            userAgent: req.headers.get('user-agent'),
            country: req.geo?.country,
            city: req.geo?.city,
        },
    }).catch(console.error); // Log DB errors without blocking the response
}

function recordSuccessfulLogin(req: NextRequest, userId: string) {
    const ip = getIp(req);
    const isInitialLogin = !req.nextUrl.searchParams.has('2fa'); // Check if it's the 2FA completion step
    if (isInitialLogin) {
        prisma.securityLog.create({
            data: {
                event: 'SUCCESSFUL_LOGIN',
                ipAddress: ip,
                userId: userId,
                details: 'Credenciales validadas, pendiente 2FA si está activo.',
                userAgent: req.headers.get('user-agent'),
                country: req.geo?.country,
                city: req.geo?.city,
            }
        }).catch(console.error);
    }
}

// --- Login Route ---
export async function POST(req: NextRequest) {
  const ip = getIp(req);

  if (!checkRateLimit(ip)) {
      return NextResponse.json({ message: 'Demasiados intentos de inicio de sesión. Por favor, inténtalo de nuevo más tarde.' }, { status: 429 });
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.password) {
      recordFailedAttempt(req, email);
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      recordFailedAttempt(req, email, user.id);
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }

    // Don't clear rate limit or record full success until 2FA is passed
    
    if (user.isTwoFactorEnabled) {
      recordSuccessfulLogin(req, user.id); // Log first step success
      return NextResponse.json({
        twoFactorRequired: true,
        userId: user.id,
      });
    }
    
    // If no 2FA, clear rate limit, create session, and log full success
    loginAttempts.delete(ip);
    recordSuccessfulLogin(req, user.id); // Log success
    
    // Don't include password in the returned user object
    const { password: _, twoFactorSecret, ...userToReturn } = user;
    
    // Create the session cookie
    await createSession(user.id);

    return NextResponse.json({ user: userToReturn });

  } catch (error) {
    console.error('[LOGIN_ERROR]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
