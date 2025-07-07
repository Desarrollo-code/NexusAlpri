
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';

// GET all users (ADMIN only)
export async function GET(req: NextRequest) {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                isTwoFactorEnabled: true,
                registeredDate: true,
            },
            orderBy: {
                name: 'asc'
            }
        });
        return NextResponse.json({ users });
    } catch (error) {
        console.error('[USERS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los usuarios' }, { status: 500 });
    }
}

// POST (create) a new user (ADMIN only)
export async function POST(req: NextRequest) {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    
    try {
        const { name, email, password, role } = await req.json();

        if (!name || !email || !password || !role) {
            return NextResponse.json({ message: 'Nombre, email, contraseña y rol son requeridos' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });
        if (existingUser) {
            return NextResponse.json({ message: 'El correo electrónico ya está en uso' }, { status: 409 });
        }
        
        const settings = await prisma.platformSettings.findFirst();
        if (settings) {
            if (password.length < settings.passwordMinLength) {
                return NextResponse.json({ message: `La contraseña debe tener al menos ${settings.passwordMinLength} caracteres.` }, { status: 400 });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role,
                registeredDate: new Date(),
            }
        });

        const { password: _, ...userToReturn } = newUser;
        return NextResponse.json(userToReturn, { status: 201 });

    } catch (error) {
        console.error('[USER_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al crear el usuario' }, { status: 500 });
    }
}
