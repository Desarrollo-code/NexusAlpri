
import prisma from '@/lib/prisma';
import type { LessonCompletionRecord } from '@/types';


interface UpdateParams {
    userId: string;
    courseId: string;
    lessonId: string;
    type: 'view' | 'quiz';
    score?: number;
}

/**
 * Calculates the weighted progress percentage for a course.
 * Quizzes contribute to the score based on their result, other lessons contribute fully.
 * @param completedRecords The records of completed lessons.
 * @param courseId The ID of the course to calculate progress for.
 * @returns The final weighted progress percentage.
 */
async function calculateWeightedProgress(completedRecords: LessonCompletionRecord[], courseId: string): Promise<number> {
    const allLessons = await prisma.lesson.findMany({
        where: { module: { courseId } },
        select: { id: true, type: true }
    });

    if (allLessons.length === 0) {
        return 100;
    }

    let totalPossibleScore = 0;
    let achievedScore = 0;

    for (const lesson of allLessons) {
        // Each lesson, regardless of type, contributes a max of 100 points to the total possible score.
        totalPossibleScore += 100;

        const completionRecord = completedRecords.find(r => r.lessonId === lesson.id);

        if (completionRecord) {
            if (completionRecord.type === 'quiz' && typeof completionRecord.score === 'number') {
                // Quiz score contributes directly to the achieved score.
                achievedScore += completionRecord.score;
            } else if (completionRecord.type === 'view') {
                // A viewed lesson contributes a full 100 points.
                achievedScore += 100;
            }
        }
    }

    return totalPossibleScore > 0 ? (achievedScore / totalPossibleScore) * 100 : 0;
}


/**
 * Updates the completion status of a lesson for a user and recalculates the weighted course progress.
 * @param params The parameters for the update.
 * @returns The updated course progress record.
 */
export async function updateLessonCompletionStatus({ userId, courseId, lessonId, type, score }: UpdateParams) {
    const progress = await prisma.courseProgress.findUnique({
        where: { userId_courseId: { userId, courseId } },
    });

    let currentRecords: LessonCompletionRecord[] = [];
    if (progress && Array.isArray(progress.completedLessonIds)) {
        currentRecords = progress.completedLessonIds as LessonCompletionRecord[];
    }
    
    // Check if a record for this lesson already exists
    const existingRecordIndex = currentRecords.findIndex(r => r.lessonId === lessonId);

    if (existingRecordIndex !== -1) {
        // If it exists, update it. This is especially important for quiz re-takes.
        currentRecords[existingRecordIndex] = { lessonId, type, score: score ?? currentRecords[existingRecordIndex].score };
    } else {
        // If it doesn't exist, add it.
        const newRecord: LessonCompletionRecord = { lessonId, type };
        if (type === 'quiz' && typeof score === 'number') {
            newRecord.score = score;
        }
        currentRecords.push(newRecord);
    }
    
    // Recalculate weighted progress
    const progressPercentage = await calculateWeightedProgress(currentRecords, courseId);
    
    // Update or create the progress record in the database
    const updatedProgress = await prisma.courseProgress.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: {
            completedLessonIds: currentRecords,
            progressPercentage: progressPercentage,
        },
        create: {
            userId,
            courseId,
            completedLessonIds: currentRecords,
            progressPercentage: progressPercentage,
        },
    });
    
    return updatedProgress;
}
