
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';

// Get all courses a specific user is enrolled in
export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
    const session = await getSession(req);
    const { userId } = params;

    if (!session || session.id !== userId) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const enrollments = await prisma.enrollment.findMany({
            where: { userId },
            include: {
                course: {
                    include: {
                        instructor: {
                            select: { name: true },
                        },
                        _count: {
                            select: { modules: true },
                        },
                    },
                },
            },
            orderBy: {
                enrolledAt: 'desc',
            },
        });
        
        const courseProgress = await prisma.courseProgress.findMany({
            where: { userId },
        });

        const data = enrollments.map(enrollment => {
            const progress = courseProgress.find(p => p.courseId === enrollment.courseId);
            return {
                id: enrollment.course.id,
                title: enrollment.course.title,
                description: enrollment.course.description,
                instructorName: enrollment.course.instructor?.name,
                instructorId: enrollment.course.instructorId,
                imageUrl: enrollment.course.imageUrl,
                modulesCount: enrollment.course._count.modules,
                enrolledAt: enrollment.enrolledAt,
                status: enrollment.course.status,
                progressPercentage: progress?.progressPercentage || 0
            };
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error('[USER_ENROLLMENTS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener las inscripciones del usuario' }, { status: 500 });
    }
}
