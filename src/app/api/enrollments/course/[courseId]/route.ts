
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';

// GET enrollments for a specific course
export async function GET(req: NextRequest, context: { params: { courseId: string } }) {
    const session = await getSession(req);
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { courseId } = context.params;
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId },
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
            },
        });
        return NextResponse.json(enrollments);
    } catch (error) {
        console.error('[COURSE_ENROLLMENTS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las inscripciones del curso' }, { status: 500 });
    }
}
