// src/app/api/users/[id]/chat-permissions/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Obtener los permisos de chat para un usuario específico
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { id: userId } = params;

    try {
        const userWithPermissions = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                allowedToChatWith: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });

        if (!userWithPermissions) {
            return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
        }

        return NextResponse.json(userWithPermissions.allowedToChatWith);
    } catch (error) {
        console.error(`[GET_CHAT_PERMISSIONS_ERROR]`, error);
        return NextResponse.json({ message: 'Error al obtener los permisos de chat' }, { status: 500 });
    }
}


// PUT: Actualizar los permisos de chat para un usuario
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { id: userId } = params;

    try {
        const { allowedUserIds } = await req.json();

        if (!Array.isArray(allowedUserIds)) {
            return NextResponse.json({ message: 'Se esperaba un array de IDs de usuario.' }, { status: 400 });
        }

        // 'set' reemplaza completamente la lista de conexiones,
        // lo que nos permite añadir y quitar permisos en una sola operación.
        await prisma.user.update({
            where: { id: userId },
            data: {
                allowedToChatWith: {
                    set: allowedUserIds.map((id: string) => ({ id })),
                },
            },
        });

        return NextResponse.json({ message: 'Permisos de chat actualizados correctamente.' });

    } catch (error) {
        console.error(`[UPDATE_CHAT_PERMISSIONS_ERROR]`, error);
        return NextResponse.json({ message: 'Error al actualizar los permisos de chat' }, { status: 500 });
    }
}
