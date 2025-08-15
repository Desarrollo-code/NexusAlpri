
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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
            await prisma.enrollment.create({
                data: {
                    userId: session.id,
                    courseId,
                    enrolledAt: new Date(),
                },
            });
            return NextResponse.json({ message: 'Inscripción exitosa' }, { status: 201 });
        } else {
            // Unenroll
            const enrollmentToDelete = await prisma.enrollment.findUnique({
                where: { userId_courseId: { userId: session.id, courseId } }
            });
            if (enrollmentToDelete) {
                // Delete progress first, then enrollment
                await prisma.courseProgress.deleteMany({
                    where: { enrollmentId: enrollmentToDelete.id }
                });
                await prisma.enrollment.delete({
                    where: { id: enrollmentToDelete.id },
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
