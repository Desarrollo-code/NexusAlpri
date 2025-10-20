// src/app/api/my-courses/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        const enrollments = await prisma.enrollment.findMany({
            where: { userId: session.id },
            include: {
                course: {
                    include: {
                        instructor: { select: { name: true, avatar: true, id: true } },
                        _count: { select: { modules: true } }
                    }
                },
                progress: true,
            },
            orderBy: {
                enrolledAt: 'desc',
            },
        });
        
        const enrolledCourses = enrollments.map(e => ({
            ...e.course,
            enrollmentId: e.id,
            isEnrolled: true,
            progressPercentage: e.progress?.progressPercentage || 0
        }));

        return NextResponse.json(enrolledCourses);
    } catch (error) {
        console.error("Error fetching user's enrolled courses:", error);
        return NextResponse.json({ message: "Error al obtener los cursos inscritos." }, { status: 500 });
    }
}
