// src/app/api/users/list/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET a simplified list of users for selectors
export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    // Allow both ADMINS and INSTRUCTORS to get this list
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const unassignedOnly = searchParams.get('unassignedOnly') === 'true';

    try {
        let whereClause: any = {
            isActive: true,
        };

        if (unassignedOnly) {
            whereClause.processId = null;
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true, // Email might be useful for identification in the selector
                avatar: true,
                role: true, // Include role for any client-side verification if needed
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
