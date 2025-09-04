
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';
import type { User } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'STUDENT', // Default role for public registration
        registeredDate: new Date(),
        isActive: true, // Se añade el estado activo por defecto
      },
    });

    const { password: _, ...userToReturn } = newUser;

    await createSession(newUser.id);

    return NextResponse.json({ user: userToReturn }, { status: 201 });

  } catch (error) {
    console.error('[REGISTER_ERROR]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
