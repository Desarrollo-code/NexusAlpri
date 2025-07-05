
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET all enrollments (ADMIN only)
export async function GET() {
    const session = await getSession();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const enrollments = await prisma.enrollment.findMany({
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
                course: { select: { id: true, title: true, instructor: { select: { id: true, name: true } } } },
            },
            orderBy: {
                enrolledAt: 'desc',
            },
        });
        return NextResponse.json(enrollments);
    } catch (error) {
        console.error('[ALL_ENROLLMENTS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener todas las inscripciones' }, { status: 500 });
    }
}
