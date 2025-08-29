// src/app/api/users/[id]/status/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { id } = params;
    
    if (session.id === id) {
        return NextResponse.json({ message: 'No puedes cambiar tu propio estado de actividad.' }, { status: 400 });
    }

    try {
        const { isActive } = await req.json();
        if (typeof isActive !== 'boolean') {
            return NextResponse.json({ message: 'El campo "isActive" es requerido y debe ser booleano.' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { isActive },
        });

        const { password, ...userToReturn } = updatedUser;
        return NextResponse.json(userToReturn);

    } catch (error) {
        console.error('[USER_STATUS_PATCH_ERROR]', error);
        return NextResponse.json({ message: 'Error al actualizar el estado del usuario' }, { status: 500 });
    }
}
