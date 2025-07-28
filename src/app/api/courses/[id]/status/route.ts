
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { CourseStatus } from '@/types';
import type { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    
    try {
        const { id } = context.params;
        const { status } = await req.json();

        if (!['DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED'].includes(status)) {
            return NextResponse.json({ message: 'Estado inválido' }, { status: 400 });
        }

        const courseToUpdate = await prisma.course.findUnique({ where: { id } });

        if (!courseToUpdate) {
            return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
        }

        if (session.role === 'INSTRUCTOR' && courseToUpdate.instructorId !== session.id) {
            return NextResponse.json({ message: 'No tienes permiso para modificar este curso' }, { status: 403 });
        }
        
        const updatedCourse = await prisma.course.update({
            where: { id },
            data: { status: status as CourseStatus },
        });
        
        if (status === 'PUBLISHED' && courseToUpdate.status !== 'PUBLISHED') {
            const allUsers = await prisma.user.findMany({ 
              where: { id: { not: session.id } }, // Exclude the user who triggered the action
              select: { id: true } 
            });
            
            await prisma.notification.createMany({
                data: allUsers.map(user => ({
                    userId: user.id,
                    title: `Nuevo Curso Disponible: ${updatedCourse.title}`,
                    description: 'Explora el nuevo contenido que hemos preparado para ti.',
                    link: `/courses/${updatedCourse.id}`,
                })),
            });
        }

        return NextResponse.json(updatedCourse);

    } catch (error) {
        console.error('[COURSE_STATUS_PATCH_ERROR]', error);
        return NextResponse.json({ message: 'Error al actualizar el estado del curso' }, { status: 500 });
    }
}
