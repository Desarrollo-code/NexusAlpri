
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

async function calculateWeightedProgress(completedRecords: AppLessonCompletionRecord[], courseId: string): Promise<number> {
    const allLessonsInCourse = await prisma.lesson.findMany({
        where: { module: { courseId } },
        select: { id: true }
    });

    if (allLessonsInCourse.length === 0) return 0;

    let totalPossibleScore = 0;
    let achievedScore = 0;

    for (const lesson of allLessonsInCourse) {
        totalPossibleScore += 100; // Each lesson is worth 100 points
        const completionRecord = completedRecords.find(r => r.lessonId === lesson.id);

        if (completionRecord) {
            if (completionRecord.type === 'quiz' && typeof completionRecord.score === 'number') {
                achievedScore += completionRecord.score; // Quiz score contributes directly
            } else if (completionRecord.type === 'view') {
                achievedScore += 100; // A viewed lesson contributes full points
            }
        }
    }

    return totalPossibleScore > 0 ? (achievedScore / totalPossibleScore) * 100 : 0;
}

/**
 * Records a user's interaction with a lesson without calculating the final progress.
 * This is used for incremental updates.
 */
export async function recordLessonInteraction({ userId, courseId, lessonId, type, score }: RecordInteractionParams) {
    const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        include: { progress: true } // Include progress to get its ID
    });

    if (!enrollment) {
        throw new Error("User is not enrolled in this course.");
    }
    
    // The progress record should now always exist, as it's created on enrollment.
    if (!enrollment.progress) {
        // This case should ideally not be reached. Log an error if it does.
        console.error(`Error: No CourseProgress found for enrollmentId ${enrollment.id}. This should have been created on enrollment.`);
        throw new Error(`Inconsistencia de datos: No se encontró el registro de progreso para la inscripción.`);
    }

    const progressId = enrollment.progress.id;

    // Upsert the lesson completion record
    await prisma.lessonCompletionRecord.upsert({
        where: {
            progressId_lessonId: {
                progressId: progressId,
                lessonId: lessonId,
            }
        },
        update: {
            type: type,
            score: score
        },
        create: {
            progressId: progressId,
            lessonId: lessonId,
            type: type,
            score: score,
        }
    });
}


/**
 * Calculates the final weighted progress for a course and saves it to the database.
 * This should be called only at the end of the course.
 */
export async function consolidateCourseProgress({ userId, courseId }: { userId: string, courseId: string }) {
     const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        include: { 
            progress: {
                include: {
                    completedLessons: true
                }
            }
        },
    });

    if (!enrollment || !enrollment.progress) {
        throw new Error("No progress found for this user and course to consolidate.");
    }
    
    const currentRecords: AppLessonCompletionRecord[] = enrollment.progress.completedLessons.map(r => ({
        lessonId: r.lessonId,
        type: r.type as 'view' | 'quiz',
        score: r.score ?? undefined,
    }));
    
    const finalPercentage = await calculateWeightedProgress(currentRecords, courseId);

    const updatedProgress = await prisma.courseProgress.update({
        where: { id: enrollment.progress.id },
        data: {
            progressPercentage: finalPercentage,
        },
    });

    return updatedProgress;
}
