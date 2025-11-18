// src/lib/progress.ts
import prisma from '@/lib/prisma';
import type { LessonCompletionRecord as AppLessonCompletionRecord } from '@/types';
import { triggerMotivationalMessage } from './gamification';

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
    const oldPercentage = enrollment.progress.progressPercentage || 0;
    
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

        // --- MOTIVATION TRIGGER ---
        // Trigger a motivational message if one is set for this specific lesson
        await triggerMotivationalMessage(userId, 'LESSON_COMPLETION', lessonId);
        // --------------------------
        
    } else if (type === 'quiz' && score !== null && existingRecord.score !== score) {
        // If it's a quiz, update the score, but it's not a "new" interaction for progress calculation.
        await prisma.lessonCompletionRecord.update({
            where: { id: existingRecord.id },
            data: { score }
        });
    }

    // Always recalculate progress after an interaction is recorded or updated, if it was a new interaction.
    if (wasNewInteraction) {
        await recalculateProgress({ userId, courseId, progressId, oldPercentage });
    }

    return wasNewInteraction;
}


/**
 * Recalculates and updates the progress percentage for a user in a course.
 */
export async function recalculateProgress({ userId, courseId, progressId, oldPercentage }: { userId: string, courseId: string, progressId: string, oldPercentage: number }) {
    
    const [completedLessonsCount, totalLessonsCount] = await Promise.all([
        prisma.lessonCompletionRecord.count({ where: { progressId } }),
        prisma.lesson.count({ where: { module: { courseId } } }),
    ]);
    
    let newPercentage = 0;
    if (totalLessonsCount > 0) {
        newPercentage = Math.round((completedLessonsCount / totalLessonsCount) * 100);
    }
    
    await prisma.courseProgress.update({
        where: { id: progressId },
        data: { 
            progressPercentage: newPercentage,
            lastActivity: new Date(),
        }
    });

    // Check for progress-based motivational messages
    if (oldPercentage < 50 && newPercentage >= 50) {
        await triggerMotivationalMessage(userId, 'COURSE_MID_PROGRESS', courseId);
    }
    if (oldPercentage < 90 && newPercentage >= 90) {
        await triggerMotivationalMessage(userId, 'COURSE_NEAR_COMPLETION', courseId);
    }
}
