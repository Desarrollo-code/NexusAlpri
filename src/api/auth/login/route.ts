// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// --- Rate Limiting Logic (In-memory, suitable for single-instance deployments) ---
const loginAttempts = new Map<string, { count: number; expiry: number }>();
const RATE_LIMIT_COUNT = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getIp(req: NextRequest) {
    return req.ip || req.headers.get('x-forwarded-for') || 'unknown';
}

function checkRateLimit(ip: string): boolean {
    const record = loginAttempts.get(ip);
    if (!record || Date.now() > record.expiry) {
        loginAttempts.delete(ip);
        return true;
    }
    return record.count < RATE_LIMIT_COUNT;
}

function recordFailedAttempt(req: NextRequest, email: string, userId?: string) {
    const ip = getIp(req);
    const record = loginAttempts.get(ip) || { count: 0, expiry: Date.now() + RATE_LIMIT_WINDOW_MS };
    record.count++;
    loginAttempts.set(ip, record);
    
    // Asynchronously log to DB without blocking the response
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
    }).catch(console.error);
}

function recordSuccessfulLogin(req: NextRequest, userId: string, details: string) {
    const ip = getIp(req);
    loginAttempts.delete(ip);
    
    prisma.securityLog.create({
        data: {
            event: 'SUCCESSFUL_LOGIN',
            ipAddress: ip,
            userId: userId,
            details: details,
            userAgent: req.headers.get('user-agent'),
            country: req.geo?.country,
            city: req.geo?.city,
        }
    }).catch(console.error);
}

// --- Login Route ---
export async function POST(req: NextRequest) {
  if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
    console.error('Error Crítico: Faltan variables de entorno DATABASE_URL o JWT_SECRET.');
    return NextResponse.json({ message: 'Error de configuración del servidor.' }, { status: 500 });
  }

  const ip = getIp(req);
  if (!checkRateLimit(ip)) {
      return NextResponse.json({ message: 'Demasiados intentos de inicio de sesión. Inténtalo de nuevo más tarde.' }, { status: 429 });
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
    
    if (!user.isActive) {
        recordFailedAttempt(req, email, user.id);
        return NextResponse.json({ message: 'Esta cuenta de usuario ha sido inactivada.' }, { status: 403 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      recordFailedAttempt(req, email, user.id);
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }
    
    if (user.isTwoFactorEnabled) {
      // Don't create session yet. Send back requirement.
      return NextResponse.json({
        twoFactorRequired: true,
        userId: user.id,
      });
    }
    
    recordSuccessfulLogin(req, user.id, 'Login exitoso (sin 2FA).');
    
    const { password: _, twoFactorSecret, ...userToReturn } = user;
    await createSession(user.id);

    return NextResponse.json({ user: userToReturn });

  } catch (error) {
    console.error('[LOGIN_ERROR]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
