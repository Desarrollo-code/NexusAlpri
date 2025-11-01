// src/app/api/users/list/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET a simplified list of users for selectors
export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        // La lógica ahora depende del rol del usuario que hace la petición.
        let usersToReturn;

        if (session.role === 'ADMINISTRATOR') {
            // Un administrador puede chatear con cualquiera (excepto consigo mismo).
            usersToReturn = await prisma.user.findMany({
                where: { 
                    isActive: true,
                    id: { not: session.id }
                },
                select: { id: true, name: true, email: true, avatar: true, role: true },
                orderBy: { name: 'asc' },
            });
        } else {
            // Otros usuarios (como instructores) solo pueden chatear con quienes tienen permiso.
            const userWithPermissions = await prisma.user.findUnique({
                where: { id: session.id },
                include: {
                    allowedToChatWith: {
                        where: { isActive: true },
                        select: { id: true, name: true, email: true, avatar: true, role: true },
                        orderBy: { name: 'asc' },
                    }
                }
            });
            usersToReturn = userWithPermissions?.allowedToChatWith || [];
        }

        return NextResponse.json({ users: usersToReturn });
    } catch (error) {
        console.error('[USERS_LIST_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener la lista de usuarios' }, { status: 500 });
    }
}
