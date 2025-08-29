
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { addXp, checkAndAwardFirstEnrollment, XP_CONFIG } from '@/lib/gamification';

export const dynamic = 'force-dynamic';

// This custom POST handler manages both enrollment and un-enrollment.
// It can now also be called by an admin/instructor to un-enroll a *different* user.
export async function POST(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        const { courseId, enroll, userId: targetUserId } = await req.json();
        const finalUserId = targetUserId || session.id;

        if (!courseId) {
            return NextResponse.json({ message: 'courseId es requerido.' }, { status: 400 });
        }

        if (enroll) {
            // Only users can enroll themselves
            if (targetUserId && targetUserId !== session.id) {
                return NextResponse.json({ message: 'No puedes inscribir a otros usuarios.' }, { status: 403 });
            }

            const existingEnrollment = await prisma.enrollment.findUnique({
                where: { userId_courseId: { userId: finalUserId, courseId } },
            });

            if (existingEnrollment) {
                return NextResponse.json({ message: 'Ya estás inscrito en este curso.' }, { status: 409 });
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

            // --- Gamification Logic ---
            await addXp(finalUserId, XP_CONFIG.ENROLL_COURSE);
            await checkAndAwardFirstEnrollment(finalUserId);
            // --------------------------

            return NextResponse.json({ message: 'Inscripción exitosa' }, { status: 201 });
        } else {
            // Un-enroll logic
            const course = await prisma.course.findUnique({ where: { id: courseId }, select: { instructorId: true } });
            
            // Authorization for un-enrolling:
            // 1. You can un-enroll yourself.
            // 2. An admin can un-enroll anyone.
            // 3. An instructor can un-enroll anyone from THEIR course.
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
            return NextResponse.json({ message: 'Inscripción cancelada' });
        }

    } catch (error) {
        console.error('[ENROLLMENT_POST_ERROR]', error);
        if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
            return NextResponse.json({ message: 'La inscripción no existía.' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Error al procesar la inscripción' }, { status: 500 });
    }
}
