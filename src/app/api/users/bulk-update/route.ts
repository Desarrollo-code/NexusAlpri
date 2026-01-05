// src/app/api/users/bulk-update/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { userIds, data } = await req.json();

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ message: 'Se requieren IDs de usuario' }, { status: 400 });
        }

        // Only allow updating specific fields in bulk for security
        const allowedUpdates: any = {};
        if (data.processId !== undefined) allowedUpdates.processId = data.processId;
        if (data.isActive !== undefined) allowedUpdates.isActive = data.isActive;
        if (data.role !== undefined) allowedUpdates.role = data.role;

        if (Object.keys(allowedUpdates).length === 0) {
            return NextResponse.json({ message: 'No hay campos válidos para actualizar' }, { status: 400 });
        }

        const updatedUsers = await prisma.user.updateMany({
            where: {
                id: { in: userIds }
            },
            data: allowedUpdates
        });

        return NextResponse.json({
            message: `${updatedUsers.count} usuarios actualizados correctamente`,
            count: updatedUsers.count
        });

    } catch (error) {
        console.error('[USERS_BULK_UPDATE_ERROR]', error);
        return NextResponse.json({ message: 'Error al actualizar usuarios' }, { status: 500 });
    }
}
