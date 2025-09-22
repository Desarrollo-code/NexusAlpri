// src/app/api/users/[id]/change-password/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    const { id } = params;

    if (!session || session.id !== id) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { currentPassword, newPassword, confirmPassword } = await req.json();

        if (newPassword !== confirmPassword) {
            return NextResponse.json({ message: 'Las nuevas contraseñas no coinciden' }, { status: 400 });
        }
        
        // Password policy check
        const settings = await prisma.platformSettings.findFirst();
        if (settings) {
            if (newPassword.length < settings.passwordMinLength) {
                return NextResponse.json({ message: `La contraseña debe tener al menos ${settings.passwordMinLength} caracteres.` }, { status: 400 });
            }
            if (settings.passwordRequireUppercase && !/[A-Z]/.test(newPassword)) {
                return NextResponse.json({ message: "La contraseña debe contener al menos una mayúscula." }, { status: 400 });
            }
            if (settings.passwordRequireLowercase && !/[a-z]/.test(newPassword)) {
                return NextResponse.json({ message: "La contraseña debe contener al menos una minúscula." }, { status: 400 });
            }
            if (settings.passwordRequireNumber && !/\d/.test(newPassword)) {
                return NextResponse.json({ message: "La contraseña debe contener al menos un número." }, { status: 400 });
            }
            if (settings.passwordRequireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
                return NextResponse.json({ message: "La contraseña debe contener al menos un carácter especial." }, { status: 400 });
            }
        }


        const user = await prisma.user.findUnique({ where: { id: id } });
        if (!user || !user.password) {
            return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
        }
        
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ message: 'La contraseña actual es incorrecta' }, { status: 400 });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: id },
            data: { password: hashedNewPassword },
        });

        // Log the security event
        const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
        await prisma.securityLog.create({
            data: {
                event: 'PASSWORD_CHANGE_SUCCESS',
                ipAddress: ip,
                userId: user.id,
                userAgent: req.headers.get('user-agent'),
                country: req.geo?.country,
                city: req.geo?.city,
            }
        });

        return NextResponse.json({ message: 'Contraseña actualizada exitosamente' });

    } catch (error) {
        console.error('[CHANGE_PASSWORD_ERROR]', error);
        return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
    }
}
