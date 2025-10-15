// src/app/api/users/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { UserRole } from '@/types';

export const dynamic = 'force-dynamic';

// GET all users (ADMIN only)
export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
        const search = searchParams.get('search');
        const role = searchParams.get('role') as UserRole | null;
        const status = searchParams.get('status'); // 'active' or 'inactive'
        const processId = searchParams.get('processId'); // Nuevo filtro

        const skip = (page - 1) * pageSize;

        let whereClause: any = {};
        const filters = [];

        if (search) {
            filters.push({
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            });
        }
        
        if (role) {
            filters.push({ role: role });
        }

        if (status) {
            filters.push({ isActive: status === 'active' });
        }
        
        if (processId) {
            filters.push({ processId: processId === 'unassigned' ? null : processId });
        }


        if (filters.length > 0) {
            whereClause.AND = filters;
        }

        const [users, totalUsers] = await prisma.$transaction([
            prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    avatar: true,
                    isTwoFactorEnabled: true,
                    registeredDate: true,
                    isActive: true,
                    processes: true, // Incluir procesos
                },
                orderBy: {
                    registeredDate: 'desc'
                },
                skip: skip,
                take: pageSize,
            }),
            prisma.user.count({ where: whereClause })
        ]);

        return NextResponse.json({ users, totalUsers });
    } catch (error) {
        console.error('[USERS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener los usuarios' }, { status: 500 });
    }
}

// POST (create) a new user (ADMIN only)
export async function POST(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    
    try {
        const { name, email, password, role, processIds } = await req.json();

        if (!name || !email || !password || !role) {
            return NextResponse.json({ message: 'Nombre, email, contraseña y rol son requeridos' }, { status: 400 });
        }
        
        const settings = await prisma.platformSettings.findFirst();
        
        if (settings && settings.emailWhitelist && settings.emailWhitelist.trim() !== '') {
            const allowedDomains = settings.emailWhitelist.split(',').map(d => d.trim().toLowerCase());
            const emailDomain = email.substring(email.lastIndexOf('@') + 1).toLowerCase();
            if (!allowedDomains.includes(emailDomain)) {
                return NextResponse.json({ message: `Solo se permiten correos con los dominios autorizados: ${settings.emailWhitelist}.` }, { status: 403 });
            }
        }
        
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });
        if (existingUser) {
            return NextResponse.json({ message: 'El correo electrónico ya está en uso' }, { status: 409 });
        }
        
        if (settings) {
            if (password.length < settings.passwordMinLength) {
                return NextResponse.json({ message: `La contraseña debe tener al menos ${settings.passwordMinLength} caracteres.` }, { status: 400 });
            }
            if (settings.passwordRequireUppercase && !/[A-Z]/.test(password)) return NextResponse.json({ message: "La contraseña debe contener al menos una mayúscula." }, { status: 400 });
            if (settings.passwordRequireLowercase && !/[a-z]/.test(password)) return NextResponse.json({ message: "La contraseña debe contener al menos una minúscula." }, { status: 400 });
            if (settings.passwordRequireNumber && !/\d/.test(password)) return NextResponse.json({ message: "La contraseña debe contener al menos un número." }, { status: 400 });
            if (settings.passwordRequireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return NextResponse.json({ message: "La contraseña debe contener al menos un carácter especial." }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role,
                registeredDate: new Date(),
                isActive: true,
                processes: { // Asignar procesos en la creación
                    connect: (processIds || []).map((id: string) => ({ id }))
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                isTwoFactorEnabled: true,
                registeredDate: true,
                isActive: true,
                processes: true,
            }
        });

        return NextResponse.json(newUser, { status: 201 });

    } catch (error) {
        console.error('[USER_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al crear el usuario' }, { status: 500 });
    }
}
