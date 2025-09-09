// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';
import type { User } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // --- VERIFICACIÓN DE VARIABLES DE ENTORNO ---
  if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
    console.error('Error Crítico: Faltan variables de entorno DATABASE_URL o JWT_SECRET en el servidor.');
    return NextResponse.json({ message: 'Error de configuración del servidor: Faltan variables de entorno críticas.' }, { status: 500 });
  }

  try {
    const settings = await prisma.platformSettings.findFirst();
    if (settings && !settings.allowPublicRegistration) {
      return NextResponse.json({ message: 'El registro público está deshabilitado por el administrador.' }, { status: 403 });
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Todos los campos son requeridos' }, { status: 400 });
    }
    
    // --- Validación de Dominio ---
    if (settings && settings.emailWhitelist && settings.emailWhitelist.trim() !== '') {
        const allowedDomains = settings.emailWhitelist.split(',').map(d => d.trim().toLowerCase());
        const emailDomain = email.substring(email.lastIndexOf('@') + 1).toLowerCase();
        if (!allowedDomains.includes(emailDomain)) {
            return NextResponse.json({ message: `Solo se permiten correos con los dominios autorizados.` }, { status: 403 });
        }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'El correo electrónico ya está en uso' }, { status: 409 });
    }
    
    // --- Validación de Contraseña ---
    if (settings) {
        if (password.length < settings.passwordMinLength) {
            return NextResponse.json({ message: `La contraseña debe tener al menos ${settings.passwordMinLength} caracteres.` }, { status: 400 });
        }
        if (settings.passwordRequireUppercase && !/[A-Z]/.test(password)) {
            return NextResponse.json({ message: "La contraseña debe contener al menos una mayúscula." }, { status: 400 });
        }
        if (settings.passwordRequireLowercase && !/[a-z]/.test(password)) {
            return NextResponse.json({ message: "La contraseña debe contener al menos una minúscula." }, { status: 400 });
        }
        if (settings.passwordRequireNumber && !/\d/.test(password)) {
            return NextResponse.json({ message: "La contraseña debe contener al menos un número." }, { status: 400 });
        }
        if (settings.passwordRequireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            return NextResponse.json({ message: "La contraseña debe contener al menos un carácter especial." }, { status: 400 });
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'STUDENT', // Default role for public registration
        registeredDate: new Date(),
        isActive: true,
      },
    });

    const { password: _, ...userToReturn } = newUser;

    await createSession(newUser.id);

    return NextResponse.json({ user: userToReturn }, { status: 201 });

  } catch (error) {
    console.error('[REGISTER_ERROR]', error);
    if (error instanceof Error && 'code' in error && (error as any).code?.startsWith('P')) {
       return NextResponse.json({ message: 'Error de base de datos al crear el usuario.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error interno del servidor al intentar registrar.' }, { status: 500 });
  }
}
