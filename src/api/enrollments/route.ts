
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { addXp, checkAndAwardFirstEnrollment, XP_CONFIG } from '@/lib/gamification';

export const dynamic = 'force-dynamic';

// POST to enroll/unenroll a user from a course
export async function POST(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        const { courseId, enroll } = await req.json(); // enroll is a boolean

        if (!courseId) {
            return NextResponse.json({ message: 'courseId es requerido.' }, { status: 400 });
        }

        if (enroll) {
            const existingEnrollment = await prisma.enrollment.findUnique({
                where: { userId_courseId: { userId: session.id, courseId } },
            });

            if (existingEnrollment) {
                return NextResponse.json({ message: 'Ya estás inscrito en este curso.' }, { status: 409 });
            }
            
            // Create enrollment and progress record atomically
            await prisma.enrollment.create({
                data: {
                    user: { connect: { id: session.id } },
                    course: { connect: { id: courseId } },
                    enrolledAt: new Date(),
                    progress: {
                        create: {
                            userId: session.id,
                            courseId,
                            progressPercentage: 0,
                        }
                    }
                },
            });

            // --- Gamification Logic ---
            await addXp(session.id, XP_CONFIG.ENROLL_COURSE);
            await checkAndAwardFirstEnrollment(session.id);
            // --------------------------

            return NextResponse.json({ message: 'Inscripción exitosa' }, { status: 201 });
        } else {
            // Unenroll
            const enrollmentToDelete = await prisma.enrollment.findUnique({
                where: { userId_courseId: { userId: session.id, courseId } },
                include: { progress: true }
            });
            if (enrollmentToDelete) {
                // Use a transaction to delete progress records and then enrollment
                await prisma.$transaction(async (tx) => {
                    if (enrollmentToDelete.progress) {
                        // Delete related LessonCompletionRecord first due to relation
                        await tx.lessonCompletionRecord.deleteMany({
                            where: { progressId: enrollmentToDelete.progress.id }
                        });
                        // Then delete the CourseProgress record
                        await tx.courseProgress.delete({
                            where: { id: enrollmentToDelete.progress.id }
                        });
                    }
                    // Finally, delete the enrollment itself
                    await tx.enrollment.delete({
                        where: { id: enrollmentToDelete.id }
                    });
                });
            }
            return NextResponse.json({ message: 'Inscripción cancelada' });
        }

    } catch (error) {
        console.error('[ENROLLMENT_POST_ERROR]', error);
        // Handle cases where deletion fails because the record doesn't exist (e.g., double-click)
        if (error instanceof Error && 'code' in error && (error as any).code === 'P2025') {
            return NextResponse.json({ message: 'La inscripción no existía.' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Error al procesar la inscripción' }, { status: 500 });
    }
}
