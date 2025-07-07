
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Get progress for a specific user in a course
export async function GET(req: Request, { params }: { params: { userId: string, courseId: string } }) {
    const session = await getSession();
    const { userId, courseId } = params;

    // A user can only see their own progress. Admins/instructors might have different authorization logic.
    if (!session || (session.id !== userId && session.role === 'STUDENT')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const progress = await prisma.courseProgress.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        
        const totalLessons = await prisma.lesson.count({
            where: { module: { courseId: courseId } },
        });

        if (!progress) {
            // Return a default progress object if none exists
            return NextResponse.json({
                userId,
                courseId,
                completedLessonIds: [],
                progressPercentage: 0,
                completedLessonsCount: 0,
                totalLessons: totalLessons,
            });
        }

        const completedLessonIds = JSON.parse(progress.completedLessonIds || '[]');

        return NextResponse.json({
            ...progress,
            completedLessonIds: completedLessonIds, // Return as array
            completedLessonsCount: completedLessonIds.length,
            totalLessons: totalLessons,
        });

    } catch (error) {
        console.error('[PROGRESS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener el progreso' }, { status: 500 });
    }
}
