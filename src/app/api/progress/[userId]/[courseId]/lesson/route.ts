
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';

// Update lesson completion status
export async function POST(req: NextRequest, { params }: { params: { userId: string, courseId: string } }) {
    const session = await getSession(req);
    const { userId, courseId } = params;

    if (!session || session.id !== userId) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { lessonId, completed } = await req.json();

        const totalLessons = await prisma.lesson.count({
            where: { module: { courseId } },
        });

        // Find or create progress record
        let progress = await prisma.courseProgress.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });

        if (!progress) {
            progress = await prisma.courseProgress.create({
                data: {
                    userId,
                    courseId,
                    completedLessonIds: [],
                }
            });
        }
        
        const completedIds = new Set<string>((progress.completedLessonIds as string[]) || []);
        
        if (completed) {
            completedIds.add(lessonId);
        } else {
            completedIds.delete(lessonId);
        }
        
        const newCompletedLessonIds = Array.from(completedIds);
        const progressPercentage = totalLessons > 0 ? (newCompletedLessonIds.length / totalLessons) * 100 : 0;

        const updatedProgress = await prisma.courseProgress.update({
            where: { userId_courseId: { userId, courseId } },
            data: {
                completedLessonIds: newCompletedLessonIds,
                progressPercentage: progressPercentage
            },
        });
        
        // Return parsed data to the client
        return NextResponse.json(updatedProgress);

    } catch (error) {
        console.error('[PROGRESS_UPDATE_ERROR]', error);
        return NextResponse.json({ message: 'Error al actualizar el progreso' }, { status: 500 });
    }
}
