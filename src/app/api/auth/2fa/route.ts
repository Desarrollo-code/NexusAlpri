
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';

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

async function handleVerify(userId: string, token: string) {
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
    
    const { password: _, ...userToReturn } = updatedUser;
    return NextResponse.json({ message: '2FA activado exitosamente', user: userToReturn });
}


async function handleDisable(userId: string, pass: string) {
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
    
    const { password: _, ...userToReturn } = updatedUser;
    return NextResponse.json({ message: '2FA desactivado exitosamente', user: userToReturn });
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
  
    try {
      const { action, userId, token, password } = await req.json();
  
      if (session.id !== userId) {
        return NextResponse.json({ message: 'Acción no permitida' }, { status: 403 });
      }
  
      switch (action) {
        case 'generate':
          return await handleGenerate(userId);
        case 'verify':
          return await handleVerify(userId, token);
        case 'disable':
          return await handleDisable(userId, password);
        default:
          return NextResponse.json({ message: 'Acción inválida' }, { status: 400 });
      }
    } catch (error) {
      console.error('[2FA_ACTION_ERROR]', error);
      return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
    }
}
