
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import type { LessonCompletionRecord } from '@/types';

// Get progress for a specific user in a course
export async function GET(req: NextRequest, context: { params: { userId: string, courseId: string } }) {
    const session = await getSession(req);
    const { userId, courseId } = context.params;

    // A user can only see their own progress. Admins/instructors might have different authorization logic.
    if (!session || (session.id !== userId && session.role === 'STUDENT')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: { userId, courseId },
            },
            include: {
                progress: true,
            }
        });
        
        if (!enrollment) {
            // No enrollment means no progress.
            return NextResponse.json({
                userId,
                courseId,
                completedLessonIds: [],
                progressPercentage: 0,
            });
        }
        
        const progress = enrollment.progress;

        if (!progress) {
            // Return a default structure if no progress record exists yet
            return NextResponse.json({
                userId,
                courseId,
                completedLessonIds: [],
                progressPercentage: 0,
            });
        }
        
        // Safely handle the completedLessonIds which is of type JsonValue
        let completedLessonIds: LessonCompletionRecord[] = [];
        if (progress.completedLessonIds && Array.isArray(progress.completedLessonIds)) {
            completedLessonIds = progress.completedLessonIds as unknown as LessonCompletionRecord[];
        }

        return NextResponse.json({
            ...progress,
            completedLessonIds, // Ensure it's always an array
        });

    } catch (error) {
        console.error('[PROGRESS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener el progreso' }, { status: 500 });
    }
}
