import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticator } from 'otplib';
import { createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { userId, token } = await req.json();

    if (!userId || !token) {
      return NextResponse.json({ message: 'ID de usuario y token son requeridos' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

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

    await createSession(userToReturn);

    return NextResponse.json({ user: userToReturn });

  } catch (error) {
    console.error('[2FA_LOGIN_ERROR]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}