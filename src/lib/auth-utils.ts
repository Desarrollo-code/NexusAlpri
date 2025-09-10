// src/lib/auth-utils.ts
import 'server-only';
import prisma from './prisma';
import type { User } from '@/types';

/**
 * Checks if a user has ownership or admin rights over a course.
 * @param session The current user's session object.
 * @param courseId The ID of the course to check.
 * @returns A boolean indicating if the user has permission.
 */
export async function checkCourseOwnership(session: User, courseId: string): Promise<boolean> {
    if (!session || !courseId) return false;
    
    if (session.role === 'ADMINISTRATOR') {
        return true;
    }

    if (session.role === 'INSTRUCTOR') {
        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                instructorId: session.id,
            },
            select: { id: true }
        });
        return !!course;
    }

    return false;
}
