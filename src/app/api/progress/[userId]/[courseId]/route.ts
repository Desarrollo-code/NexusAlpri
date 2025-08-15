import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import type { LessonCompletionRecord as AppLessonCompletionRecord } from '@/types';

export const dynamic = 'force-dynamic';

// Get progress for a specific user in a course
export async function GET(req: NextRequest, context: { params: { userId: string, courseId: string } }) {
    const session = await getCurrentUser();
    const { userId, courseId } = context.params;

    // A user can only see their own progress. Admins/instructors might have different authorization logic.
    if (!session || (session.id !== userId && session.role === 'STUDENT')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const progress = await prisma.courseProgress.findFirst({
            where: {
                userId: userId,
                courseId: courseId,
            },
            include: {
                completedLessons: true // Include the related records
            }
        });
        
        if (!progress) {
            // Return a default structure if no progress record exists yet
            return NextResponse.json({
                userId,
                courseId,
                completedLessons: [],
                progressPercentage: 0,
            });
        }
        
        // Map the included records to the desired structure for the client
        const completedLessonRecords = progress.completedLessons.map(record => ({
            lessonId: record.lessonId,
            type: record.type,
            score: record.score,
        }));

        return NextResponse.json({
            ...progress,
            completedLessons: completedLessonRecords,
            completedLessonIds: progress.completedLessons.map(l => l.lessonId) // Keep for backward compatibility if needed
        });

    } catch (error) {
        console.error('[PROGRESS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener el progreso' }, { status: 500 });
    }
}
