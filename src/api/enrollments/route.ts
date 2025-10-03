// src/app/api/enrollments/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { addXp, checkAndAwardFirstEnrollment, XP_CONFIG, triggerMotivationalMessage } from '@/lib/gamification';

export const dynamic = 'force-dynamic';

// This custom POST handler manages only enrollment.
// An admin or instructor can also enroll a specific user.
export async function POST(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        const { courseId, userId, enroll } = await req.json();
        const finalUserId = userId || session.id;

        if (!courseId) {
            return NextResponse.json({ message: 'courseId es requerido.' }, { status: 400 });
        }

        const courseToEnroll = await prisma.course.findUnique({
            where: { id: courseId },
            select: { instructorId: true, prerequisiteId: true }
        });

        if (!courseToEnroll) {
            return NextResponse.json({ message: 'Curso no encontrado.' }, { status: 404 });
        }
        
        // --- LÓGICA DE PRERREQUISITOS ---
        if (courseToEnroll.prerequisiteId) {
            const prerequisiteProgress = await prisma.courseProgress.findFirst({
                where: {
                    userId: finalUserId,
                    courseId: courseToEnroll.prerequisiteId,
                    progressPercentage: 100 // El curso debe estar completado
                }
            });

            if (!prerequisiteProgress) {
                return NextResponse.json({ message: 'Debes completar el curso prerrequisito antes de inscribirte a este.' }, { status: 403 });
            }
        }
        // --- FIN LÓGICA DE PRERREQUISITOS ---
        
        if (userId && userId !== session.id) {
            const isAdmin = session.role === 'ADMINISTRATOR';
            const isCourseInstructor = session.role === 'INSTRUCTOR' && courseToEnroll?.instructorId === session.id;
            if (!isAdmin && !isCourseInstructor) {
                return NextResponse.json({ message: 'No tienes permiso para inscribir a este usuario.' }, { status: 403 });
            }
        }

        const existingEnrollment = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId: finalUserId, courseId } },
        });

        if (existingEnrollment) {
            return NextResponse.json({ message: 'El usuario ya está inscrito en este curso.' }, { status: 409 });
        }
        
        await prisma.enrollment.create({
            data: {
                user: { connect: { id: finalUserId } },
                course: { connect: { id: courseId } },
                enrolledAt: new Date(),
                progress: {
                    create: {
                        userId: finalUserId,
                        courseId,
                        progressPercentage: 0,
                    }
                }
            },
        });

        await addXp(finalUserId, XP_CONFIG.ENROLL_COURSE);
        await checkAndAwardFirstEnrollment(finalUserId);
        await triggerMotivationalMessage(finalUserId, 'COURSE_ENROLLMENT', courseId);

        return NextResponse.json({ message: 'Inscripción exitosa' }, { status: 201 });

    } catch (error) {
        console.error('[ENROLLMENT_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al procesar la inscripción' }, { status: 500 });
    }
}


// DELETE handler for un-enrollment.
export async function DELETE(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const targetUserId = searchParams.get('userId'); // Admin/Instructor can specify a user
    
    const finalUserId = targetUserId || session.id;

    if (!courseId) {
        return NextResponse.json({ message: 'El parámetro courseId es requerido.' }, { status: 400 });
    }

    try {
        const course = await prisma.course.findUnique({ where: { id: courseId }, select: { instructorId: true } });
            
        const isSelf = finalUserId === session.id;
        const isAdmin = session.role === 'ADMINISTRATOR';
        const isCourseInstructor = session.role === 'INSTRUCTOR' && course?.instructorId === session.id;

        if (!isSelf && !isAdmin && !isCourseInstructor) {
            return NextResponse.json({ message: 'No tienes permiso para cancelar esta inscripción.' }, { status: 403 });
        }

        const enrollmentToDelete = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId: finalUserId, courseId } },
            include: { progress: true }
        });

        if (enrollmentToDelete) {
            await prisma.$transaction(async (tx) => {
                if (enrollmentToDelete.progress) {
                    await tx.lessonCompletionRecord.deleteMany({ where: { progressId: enrollmentToDelete.progress.id } });
                    await tx.quizAttempt.deleteMany({ where: { userId: finalUserId, quiz: { contentBlock: { lesson: { module: { courseId } } } } }});
                    await tx.courseProgress.delete({ where: { id: enrollmentToDelete.progress.id } });
                }
                await tx.enrollment.delete({ where: { id: enrollmentToDelete.id } });
            });
        }
        return NextResponse.json({ message: 'Inscripción cancelada' }, { status: 200 });

    } catch (error) {
        console.error('[ENROLLMENT_DELETE_ERROR]', error);
        if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
            return NextResponse.json({ message: 'La inscripción no existía.' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Error al procesar la cancelación de inscripción' }, { status: 500 });
    }
}