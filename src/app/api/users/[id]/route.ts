// src/app/api/users/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET a specific user
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    const { id } = params;
    // Allow admins to get any user, and any user to get their own profile
    if (!session || (session.role !== 'ADMINISTRATOR' && session.id !== id)) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                processes: true, // Incluir procesos
            }
        });
        if (!user) {
            return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
        }
        const { password, twoFactorSecret, ...userToReturn } = user;
        return NextResponse.json(userToReturn);
    } catch (error) {
        console.error('[USER_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener el usuario' }, { status: 500 });
    }
}

// PUT (update) a user
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    if (session.role !== 'ADMINISTRATOR' && session.id !== id) {
         return NextResponse.json({ message: 'No tienes permiso para actualizar este usuario.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
        let dataToUpdate: any = {};
        
        if ('name' in body) dataToUpdate.name = body.name;
        if ('avatar' in body) dataToUpdate.avatar = body.avatar;
        if ('theme' in body) dataToUpdate.theme = body.theme;

        // Admin-only or self-edit password
        if ('password' in body && body.password) {
            dataToUpdate.password = await bcrypt.hash(body.password, 10);
        }
        
        // Process assignments - Only Admins can do this
        if ('processIds' in body && Array.isArray(body.processIds) && session.role === 'ADMINISTRATOR') {
            dataToUpdate.processes = {
                set: body.processIds.map((pid: string) => ({ id: pid }))
            }
        }

        if (session.role === 'ADMINISTRATOR') {
            const userToUpdate = await prisma.user.findUnique({ where: { id } });
            if (!userToUpdate) {
                 return NextResponse.json({ message: 'Usuario a actualizar no encontrado' }, { status: 404 });
            }

            if ('email' in body && body.email !== userToUpdate.email) {
                const existingUser = await prisma.user.findFirst({ where: { email: body.email, NOT: { id } } });
                if (existingUser) {
                    return NextResponse.json({ message: 'El correo electrónico ya está en uso' }, { status: 409 });
                }
                dataToUpdate.email = body.email;
            }

            if ('role' in body && body.role !== userToUpdate.role) { 
                dataToUpdate.role = body.role;
                await prisma.securityLog.create({
                    data: {
                        event: 'USER_ROLE_CHANGED',
                        ipAddress: ip,
                        userId: id,
                        details: `Rol cambiado de ${userToUpdate.role} a ${body.role} por el administrador ${session.email}.`,
                        userAgent: req.headers.get('user-agent'),
                        country: req.geo?.country,
                        city: req.geo?.city,
                    }
                });
            }
        }
        
        if (Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json({ message: 'No hay datos para actualizar.' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
        });

        const { password, twoFactorSecret, ...userToReturn } = updatedUser;
        return NextResponse.json(userToReturn);

    } catch (error) {
        console.error('[USER_PUT_ERROR]', error);
        return NextResponse.json({ message: 'Error al actualizar el usuario' }, { status: 500 });
    }
}


// DELETE a user -> Now INACTIVATE
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    
    const { id } = params;
    if (session.id === id) {
        return NextResponse.json({ message: 'No puedes inactivar tu propia cuenta' }, { status: 400 });
    }

    try {
        await prisma.user.update({ 
            where: { id },
            data: { isActive: false }
        });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[USER_INACTIVATE_ERROR]', error);
        return NextResponse.json({ message: 'Error al inactivar el usuario' }, { status: 500 });
    }
}
