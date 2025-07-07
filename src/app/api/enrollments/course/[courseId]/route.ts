
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';

// GET enrollments for a specific course
export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
    const session = await getSession(req);
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { courseId } = params;
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

// POST to enroll/unenroll a user from a course
export async function POST(req: NextRequest) {
    const session = await getSession(req);
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        const { courseId, enroll } = await req.json(); // enroll is a boolean

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
            await prisma.enrollment.delete({
                where: { userId_courseId: { userId: session.id, courseId } },
            });
            // Also delete progress
            await prisma.courseProgress.deleteMany({
                where: { userId: session.id, courseId }
            });
            return NextResponse.json({ message: 'Inscripción cancelada' });
        }

    } catch (error) {
        console.error('[ENROLLMENT_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al procesar la inscripción' }, { status: 500 });
    }
}
