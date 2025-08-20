// src/app/api/users/list/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET a simplified list of users for selectors
export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    // Allow both ADMINS and INSTRUCTORS to get this list
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true, // Email might be useful for identification in the selector
                avatar: true,
            },
            orderBy: {
                name: 'asc'
            },
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('[USERS_LIST_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener la lista de usuarios' }, { status: 500 });
    }
}
