// src/app/api/courses/assignments/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkCourseOwnership } from '@/lib/auth-utils';
import { sendCourseAssignmentNotification } from '@/lib/gamification';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { courseId, userIds } = await req.json();

        if (!courseId || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ message: 'Se requiere courseId y una lista de userIds.' }, { status: 400 });
        }

        // Permiso: Admin puede asignar cualquier curso, Instructor solo los suyos.
        if (session.role === 'INSTRUCTOR') {
            const hasOwnership = await checkCourseOwnership(session, courseId);
            if (!hasOwnership) {
                return NextResponse.json({ message: 'No tienes permiso para asignar este curso.' }, { status: 403 });
            }
        }
        
        const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true }});
        if (!course) {
            return NextResponse.json({ message: 'Curso no encontrado.' }, { status: 404 });
        }

        const existingAssignments = await prisma.courseAssignment.findMany({
            where: { courseId, userId: { in: userIds } },
            select: { userId: true }
        });
        const existingAssignmentUserIds = new Set(existingAssignments.map(a => a.userId));

        // También verificamos si ya están inscritos, para no duplicar.
        const existingEnrollments = await prisma.enrollment.findMany({
            where: { courseId, userId: { in: userIds } },
            select: { userId: true }
        });
        const existingEnrollmentUserIds = new Set(existingEnrollments.map(e => e.userId));

        const userIdsToAssign = userIds.filter(id => !existingAssignmentUserIds.has(id) && !existingEnrollmentUserIds.has(id));

        if (userIdsToAssign.length === 0) {
            return NextResponse.json({ message: 'Todos los usuarios seleccionados ya están asignados o inscritos en este curso.' }, { status: 200 });
        }

        const assignmentData = userIdsToAssign.map(userId => ({
            courseId,
            userId,
            assignedById: session.id,
        }));

        await prisma.courseAssignment.createMany({
            data: assignmentData,
        });

        // Enviar notificaciones a los usuarios recién asignados
        for (const userId of userIdsToAssign) {
            await sendCourseAssignmentNotification(userId, courseId, course.title, session.name);
        }

        return NextResponse.json({ message: `Se asignó el curso a ${userIdsToAssign.length} usuario(s) exitosamente.` }, { status: 201 });

    } catch (error) {
        console.error('[COURSE_ASSIGNMENT_ERROR]', error);
        return NextResponse.json({ message: 'Error al asignar el curso a los usuarios' }, { status: 500 });
    }
}
