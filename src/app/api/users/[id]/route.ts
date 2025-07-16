
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';

// GET a specific user
export async function GET(req: NextRequest, context: { params: { id: string } }) {
    const session = await getSession(req);
    const { id } = context.params;
    // Allow admins to get any user, and any user to get their own profile
    if (!session || (session.role !== 'ADMINISTRATOR' && session.id !== id)) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
        }
        const { password, ...userToReturn } = user;
        return NextResponse.json(userToReturn);
    } catch (error) {
        console.error('[USER_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener el usuario' }, { status: 500 });
    }
}

// PUT (update) a user
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
    const session = await getSession(req);
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { id } = context.params;
    // Admin can edit anyone. A user can edit their own profile.
    if (session.role !== 'ADMINISTRATOR' && session.id !== id) {
         return NextResponse.json({ message: 'No tienes permiso para actualizar este usuario.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        
        const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';

        let dataToUpdate: any = {};
        
        // General profile updates (name, avatar) that a user can do for themselves
        if ('name' in body) dataToUpdate.name = body.name;
        if ('avatar' in body) dataToUpdate.avatar = body.avatar;

        // Admin-only updates
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
                        details: `Rol cambiado de ${userToUpdate.role} a ${body.role} por el administrador ${session.email}.`
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

        const { password, ...userToReturn } = updatedUser;
        return NextResponse.json(userToReturn);

    } catch (error) {
        console.error('[USER_PUT_ERROR]', error);
        return NextResponse.json({ message: 'Error al actualizar el usuario' }, { status: 500 });
    }
}


// DELETE a user
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
    const session = await getSession(req);
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    
    if (session.id === context.params.id) {
        return NextResponse.json({ message: 'No puedes eliminar tu propia cuenta' }, { status: 400 });
    }

    try {
        await prisma.user.delete({ where: { id: context.params.id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[USER_DELETE_ERROR]', error);
        return NextResponse.json({ message: 'Error al eliminar el usuario' }, { status: 500 });
    }
}
