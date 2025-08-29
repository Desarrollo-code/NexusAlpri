import prisma from '@/lib/prisma';
import type { LessonCompletionRecord as AppLessonCompletionRecord } from '@/types';

export const dynamic = 'force-dynamic';

interface RecordInteractionParams {
    userId: string;
    courseId: string;
    lessonId: string;
    type: 'view' | 'quiz';
    score?: number;
}

/**
 * Recalculates and updates the progress percentage for a user in a course.
 */
export async function recalculateProgress({ userId, courseId }: { userId: string, courseId: string }) {
    const [progress, totalLessonsCount] = await Promise.all([
        prisma.courseProgress.findFirst({
            where: { userId, courseId },
            include: { completedLessons: true }
        }),
        prisma.lesson.count({ where: { module: { courseId } } })
    ]);
    
    if (!progress) {
        throw new Error("No progress record found for this user and course.");
    }
    
    if (totalLessonsCount === 0) {
        await prisma.courseProgress.update({
            where: { id: progress.id },
            data: { progressPercentage: 100 }
        });
        return;
    }

    const completedLessonsCount = progress.completedLessons.length;
    const newPercentage = Math.round((completedLessonsCount / totalLessonsCount) * 100);
    
    const updatedProgress = await prisma.courseProgress.update({
        where: { id: progress.id },
        data: { 
            progressPercentage: newPercentage,
            completedAt: newPercentage === 100 ? new Date() : null,
        }
    });

    return updatedProgress;
}


/**
 * Records a user's interaction with a lesson.
 * This is used for incremental updates.
 * @returns {Promise<boolean>} - Returns true if a new interaction was created, false if it already existed.
 */
export async function recordLessonInteraction({ userId, courseId, lessonId, type, score }: RecordInteractionParams): Promise<boolean> {
    const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        include: { progress: true }
    });

    if (!enrollment || !enrollment.progress) {
        throw new Error("User is not enrolled or progress record is missing.");
    }

    const progressId = enrollment.progress.id;
    
    // Check if the record already exists
    const existingRecord = await prisma.lessonCompletionRecord.findUnique({
        where: { progressId_lessonId: { progressId, lessonId } }
    });
    
    if (existingRecord) {
        // If it exists, it's not a new interaction
        return false;
    }

    // Create the record if it doesn't exist
    await prisma.lessonCompletionRecord.create({
        data: {
            progressId: progressId,
            lessonId: lessonId,
            type: type,
            score: score,
        }
    });
    
    // It's a new interaction
    return true;
}
