// src/app/api/progress/[userId]/[courseId]/consolidate/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { checkAndAwardCourseCompletionAchievements } from '@/lib/gamification';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { userId: string, courseId: string } }) {
    const session = await getCurrentUser();
    const { userId, courseId } = params;

    if (!session || session.id !== userId) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const progress = await prisma.courseProgress.findFirst({
            where: { userId, courseId },
            include: { completedLessons: true }
        });

        if (!progress) {
            return NextResponse.json({ message: 'No se encontró el progreso para este curso.' }, { status: 404 });
        }

        const totalLessonsInCourse = await prisma.lesson.count({ where: { module: { courseId } } });

        if (totalLessonsInCourse === 0) {
            return NextResponse.json({ progressPercentage: 100 });
        }
        
        if (progress.completedLessons.length < totalLessonsInCourse) {
            return NextResponse.json({ message: 'Aún no has interactuado con todas las lecciones del curso.' }, { status: 400 });
        }

        // --- LÓGICA DE CÁLCULO DE NOTA FINAL ---
        let totalScoreSum = 0;
        progress.completedLessons.forEach(record => {
            // Si la lección fue un quiz y tiene una nota, usa su puntuación guardada.
            if (record.type === 'quiz' && typeof record.score === 'number') {
                totalScoreSum += record.score;
            } else { 
                // Si fue una simple vista (texto, video, archivo), cuenta como 100%.
                totalScoreSum += 100;
            }
        });
        
        const finalPercentage = totalLessonsInCourse > 0 
            ? Math.round(totalScoreSum / totalLessonsInCourse)
            : 100;

        const updatedProgress = await prisma.courseProgress.update({
            where: { id: progress.id },
            data: { 
                progressPercentage: finalPercentage,
                completedAt: new Date(),
            }
        });
        
        // Otorgar logros por completar cursos
        await checkAndAwardCourseCompletionAchievements(userId);
        
        return NextResponse.json(updatedProgress);

    } catch (error) {
        console.error('[CONSOLIDATE_PROGRESS_ERROR]', error);
        return NextResponse.json({ message: 'Error al consolidar el progreso' }, { status: 500 });
    }
}
