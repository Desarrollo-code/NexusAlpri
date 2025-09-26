
// src/lib/progress.ts
import prisma from '@/lib/prisma';
import type { LessonCompletionRecord as AppLessonCompletionRecord } from '@/types';

export const dynamic = 'force-dynamic';

interface RecordInteractionParams {
    userId: string;
    courseId: string;
    lessonId: string;
    type: 'view' | 'quiz' | 'video';
    score?: number | null;
}

/**
 * Records a user's interaction with a lesson and immediately recalculates course progress.
 * This is used for incremental updates.
 * @returns {Promise<boolean>} - Returns true if a new interaction was created, false if it already existed.
 */
export async function recordLessonInteraction({ userId, courseId, lessonId, type, score = null }: RecordInteractionParams): Promise<boolean> {
    const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        include: { progress: true }
    });

    if (!enrollment || !enrollment.progress) {
        throw new Error("User is not enrolled or progress record is missing.");
    }

    const progressId = enrollment.progress.id;
    
    const existingRecord = await prisma.lessonCompletionRecord.findUnique({
        where: { progressId_lessonId: { progressId, lessonId } }
    });
    
    let wasNewInteraction = false;
    
    if (!existingRecord) {
        // Create the record if it doesn't exist
        await prisma.lessonCompletionRecord.create({
            data: { progressId, lessonId, type, score }
        });
        wasNewInteraction = true;
    } else if (type === 'quiz' && score !== null && existingRecord.score !== score) {
        // If it's a quiz, update the score, but it's not a "new" interaction for progress calculation.
        await prisma.lessonCompletionRecord.update({
            where: { id: existingRecord.id },
            data: { score }
        });
    }

    // Always recalculate progress after an interaction is recorded or updated
    await recalculateProgress({ userId, courseId, progressId });

    return wasNewInteraction;
}


/**
 * Recalculates and updates the progress percentage for a user in a course.
 */
export async function recalculateProgress({ userId, courseId, progressId }: { userId: string, courseId: string, progressId: string }) {
    
    const [completedLessonsCount, totalLessonsCount] = await Promise.all([
        prisma.lessonCompletionRecord.count({ where: { progressId } }),
        prisma.lesson.count({ where: { module: { courseId } } }),
    ]);
    
    if (totalLessonsCount === 0) {
        await prisma.courseProgress.update({
            where: { id: progressId },
            data: { progressPercentage: 100 }
        });
        return;
    }

    const newPercentage = Math.round((completedLessonsCount / totalLessonsCount) * 100);
    
    // NOTA: Se ha eliminado la lógica de notificación de "mitad de camino"
    // que estaba causando un error 500. Se puede reintroducir en el futuro
    // con una consulta más segura si es necesario.

    await prisma.courseProgress.update({
        where: { id: progressId },
        data: { 
            progressPercentage: newPercentage,
            lastActivity: new Date(),
        }
    });
}
