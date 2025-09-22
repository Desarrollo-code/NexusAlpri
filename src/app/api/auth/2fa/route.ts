// src/app/api/auth/2fa/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import bcrypt from 'bcryptjs';
import { createSession, getCurrentUser } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

authenticator.options = {
  window: 1, // 1 * 30-second window for verification
};

async function handleGenerate(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'NexusAlpri', secret);

    await prisma.user.update({
        where: { id: userId },
        data: { twoFactorSecret: secret },
    });

    const dataUrl = await qrcode.toDataURL(otpauthUrl);
    return NextResponse.json({ dataUrl });
}

async function handleVerify(req: NextRequest, userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
        return NextResponse.json({ message: 'El secreto 2FA no está configurado para este usuario' }, { status: 400 });
    }

    const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });
    if (!isValid) {
        return NextResponse.json({ message: 'Código de verificación inválido' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isTwoFactorEnabled: true },
    });

    await prisma.securityLog.create({
        data: {
            event: 'TWO_FACTOR_ENABLED',
            ipAddress: req.ip || req.headers.get('x-forwarded-for'),
            userId,
            userAgent: req.headers.get('user-agent'),
            country: req.geo?.country,
            city: req.geo?.city,
        }
    });
    
    const { password: _, ...userToReturn } = updatedUser;
    return NextResponse.json({ message: '2FA activado exitosamente', user: userToReturn });
}

async function handleDisable(req: NextRequest, userId: string, pass: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
        return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
        return NextResponse.json({ message: 'Contraseña incorrecta' }, { status: 403 });
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            isTwoFactorEnabled: false,
            twoFactorSecret: null,
        },
    });

    await prisma.securityLog.create({
        data: {
            event: 'TWO_FACTOR_DISABLED',
            ipAddress: req.ip || req.headers.get('x-forwarded-for'),
            userId,
            userAgent: req.headers.get('user-agent'),
            country: req.geo?.country,
            city: req.geo?.city,
        }
    });
    
    const { password: _, ...userToReturn } = updatedUser;
    return NextResponse.json({ message: '2FA desactivado exitosamente', user: userToReturn });
}

async function handleLoginVerify(req: NextRequest, userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ message: '2FA no está habilitado para este usuario.' }, { status: 400 });
    }
    
    const isValidToken = authenticator.verify({
        token,
        secret: user.twoFactorSecret,
    });

    if (!isValidToken) {
        return NextResponse.json({ message: 'Código 2FA inválido.' }, { status: 401 });
    }

    const { password: _, twoFactorSecret, ...userToReturn } = user;
    await createSession(user.id);

    // Log the successful 2FA login event
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    await prisma.securityLog.create({
        data: {
            event: 'SUCCESSFUL_LOGIN',
            ipAddress: ip,
            userId: user.id,
            details: 'Login completado con 2FA',
            userAgent: req.headers.get('user-agent'),
            country: req.geo?.country,
            city: req.geo?.city,
        }
    }).catch(console.error);

    return NextResponse.json({ user: userToReturn });
}

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // For login verification, we don't need a session yet
    if (action === 'login') {
        const body = await req.json();
        const { userId, token } = body;
        if (!userId || !token) {
            return NextResponse.json({ message: 'ID de usuario y token son requeridos para el login' }, { status: 400 });
        }
        return await handleLoginVerify(req, userId, token);
    }

    // For other actions, we require an active session
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
  
    try {
      const body = await req.json();
      const { userId, token, password } = body;
  
      if (session.id !== userId) {
        return NextResponse.json({ message: 'Acción no permitida' }, { status: 403 });
      }
  
      switch (action) {
        case 'generate':
          return await handleGenerate(userId);
        case 'verify':
          if (!token) return NextResponse.json({ message: 'Token es requerido para la verificación' }, { status: 400 });
          return await handleVerify(req, userId, token);
        case 'disable':
          if (!password) return NextResponse.json({ message: 'Contraseña es requerida para desactivar' }, { status: 400 });
          return await handleDisable(req, userId, password);
        default:
          return NextResponse.json({ message: 'Acción inválida proporcionada' }, { status: 400 });
      }
    } catch (error) {
      console.error('[2FA_ACTION_ERROR]', error);
      if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'El cuerpo de la solicitud no es un JSON válido.' }, { status: 400 });
      }
      return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
    }
}
