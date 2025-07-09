import prisma from '@/lib/prisma';

/**
 * Updates the completion status of a lesson for a user and recalculates the course progress.
 * @param userId The ID of the user.
 * @param courseId The ID of the course.
 * @param lessonId The ID of the lesson to update.
 * @param completed The new completion status of the lesson.
 * @returns The updated course progress record.
 */
export async function updateLessonCompletionStatus(userId: string, courseId: string, lessonId: string, completed: boolean) {
    const totalLessons = await prisma.lesson.count({
        where: { module: { courseId } },
    });

    if (totalLessons === 0) {
        // Avoid division by zero and handle courses with no lessons
        const progressRecord = await prisma.courseProgress.upsert({
            where: { userId_courseId: { userId, courseId } },
            update: { progressPercentage: 100 },
            create: { userId, courseId, completedLessonIds: [], progressPercentage: 100 },
        });
        return progressRecord;
    }

    // Find or create the progress record for the user in the course
    let progress = await prisma.courseProgress.findUnique({
        where: { userId_courseId: { userId, courseId } },
    });

    if (!progress) {
        progress = await prisma.courseProgress.create({
            data: {
                userId,
                courseId,
                completedLessonIds: [],
                progressPercentage: 0,
            }
        });
    }
    
    // Use a Set for efficient add/delete operations
    const completedIds = new Set<string>((progress.completedLessonIds as string[]) || []);
    
    if (completed) {
        completedIds.add(lessonId);
    } else {
        completedIds.delete(lessonId);
    }
    
    const newCompletedLessonIds = Array.from(completedIds);
    const progressPercentage = (newCompletedLessonIds.length / totalLessons) * 100;

    // Update the record with the new list of completed lessons and the calculated percentage
    const updatedProgress = await prisma.courseProgress.update({
        where: { userId_courseId: { userId, courseId } },
        data: {
            completedLessonIds: newCompletedLessonIds,
            progressPercentage: progressPercentage
        },
    });
    
    return updatedProgress;
}
