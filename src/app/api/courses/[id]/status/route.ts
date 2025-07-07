
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { CourseStatus } from '@/types';
import type { NextRequest } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getSession(req);
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    
    try {
        const { id } = params;
        const { status } = await req.json();

        if (!['DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED'].includes(status)) {
            return NextResponse.json({ message: 'Estado inválido' }, { status: 400 });
        }

        const courseToUpdate = await prisma.course.findUnique({ where: { id } });

        if (!courseToUpdate) {
            return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
        }

        if (session.role !== 'ADMINISTRATOR' && courseToUpdate.instructorId !== session.id) {
            return NextResponse.json({ message: 'No tienes permiso para modificar este curso' }, { status: 403 });
        }
        
        const updatedCourse = await prisma.course.update({
            where: { id },
            data: { status: status as CourseStatus },
        });

        return NextResponse.json(updatedCourse);

    } catch (error) {
        console.error('[COURSE_STATUS_PATCH_ERROR]', error);
        return NextResponse.json({ message: 'Error al actualizar el estado del curso' }, { status: 500 });
    }
}
