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

function recordSuccessfulLogin(req: NextRequest, userId: string, is2FACompleted: boolean = false) {
    const ip = getIp(req);
    const details = is2FACompleted 
        ? 'Login completado con 2FA.'
        : 'Credenciales validadas, pendiente 2FA si está activo.';

    // Solo se registra un evento de login exitoso por intento.
    // Si no es 2FA, se registra ahora. Si es 2FA, se registrará al final.
    if (!is2FACompleted) {
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
      // Log successful credential validation, but don't create session yet
      recordSuccessfulLogin(req, user.id, false); 
      return NextResponse.json({
        twoFactorRequired: true,
        userId: user.id,
      });
    }
    
    loginAttempts.delete(ip);
    recordSuccessfulLogin(req, user.id, true); // Log full success as 2FA is not enabled
    
    const { password: _, twoFactorSecret, ...userToReturn } = user;
    
    await createSession(user.id);

    return NextResponse.json({ user: userToReturn });

  } catch (error) {
    console.error('[LOGIN_ERROR]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
