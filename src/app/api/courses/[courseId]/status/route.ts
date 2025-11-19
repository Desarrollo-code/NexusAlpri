
// src/app/api/courses/[courseId]/status/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import type { CourseStatus } from '@/types';
import prisma from '@/lib/prisma';
import { checkFirstCoursePublished } from '@/lib/gamification';

export const dynamic = 'force-dynamic';
export async function PATCH(req: NextRequest, { params }: { params: { courseId: string } }) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    
    try {
        const { courseId } = params;
        const { status } = await req.json();

        if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
            return NextResponse.json({ message: 'Estado inválido' }, { status: 400 });
        }

        const courseToUpdate = await prisma.course.findUnique({ where: { id: courseId } });

        if (!courseToUpdate) {
            return NextResponse.json({ message: 'Curso no encontrado' }, { status: 404 });
        }

        if (session.role === 'INSTRUCTOR' && courseToUpdate.instructorId !== session.id) {
            return NextResponse.json({ message: 'No tienes permiso para modificar este curso' }, { status: 403 });
        }
        
        const dataToUpdate: { status: CourseStatus; publicationDate?: Date } = { status: status as CourseStatus };
        if (status === 'PUBLISHED' && courseToUpdate.status !== 'PUBLISHED') {
            dataToUpdate.publicationDate = new Date();
        }

        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: dataToUpdate,
        });
        
        // --- Security Log ---
        await prisma.securityLog.create({
            data: {
              event: 'COURSE_UPDATED',
              ipAddress: req.ip || req.headers.get('x-forwarded-for'),
              userId: session.id,
              details: `Estado del curso "${updatedCourse.title}" cambiado a ${status}.`,
              userAgent: req.headers.get('user-agent'),
            }
        });

        // Gamification check for instructor publishing first course
        if (status === 'PUBLISHED') {
            await checkFirstCoursePublished(updatedCourse.instructorId);
        }

        if (status === 'PUBLISHED' && courseToUpdate.status !== 'PUBLISHED') {
            const allUsers = await prisma.user.findMany({ 
              where: { id: { not: session.id } }, 
              select: { id: true } 
            });
            
            await prisma.notification.createMany({
                data: allUsers.map(user => ({
                    userId: user.id,
                    title: `Nuevo curso disponible: ${updatedCourse.title}`,
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
