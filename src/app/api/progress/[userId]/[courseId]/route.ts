
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
        const progress = await prisma.courseProgress.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        
        if (!progress) {
            return NextResponse.json({
                userId,
                courseId,
                completedLessonIds: [],
                progressPercentage: 0,
            });
        }

        let completedLessonIds: LessonCompletionRecord[] = [];
        if (progress.completedLessonIds) {
            // Handle both array (from direct JSON) and string (from DB) representations
            if (Array.isArray(progress.completedLessonIds)) {
                completedLessonIds = progress.completedLessonIds as LessonCompletionRecord[];
            } else if (typeof progress.completedLessonIds === 'string') {
                 try {
                    const parsed = JSON.parse(progress.completedLessonIds);
                    if (Array.isArray(parsed)) {
                        completedLessonIds = parsed;
                    }
                 } catch (e) {
                    console.error("Failed to parse completedLessonIds JSON in GET route:", progress.completedLessonIds, e);
                 }
            } else if (typeof progress.completedLessonIds === 'object') {
                // It might already be a JSON object if Prisma handles it automatically in some cases
                completedLessonIds = progress.completedLessonIds as unknown as LessonCompletionRecord[];
            }
        }

        return NextResponse.json({
            ...progress,
            completedLessonIds, // Send the parsed array to the client
        });

    } catch (error) {
        console.error('[PROGRESS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener el progreso' }, { status: 500 });
    }
}
