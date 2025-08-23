import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { consolidateCourseProgress } from '@/lib/progress';
import { addXp, checkAndAwardCourseCompletionAchievements, XP_CONFIG } from '@/lib/gamification';

export async function POST(req: NextRequest, { params }: { params: { userId: string, courseId: string } }) {
    const session = await getCurrentUser();
    const { userId, courseId } = await params;

    if (!session || session.id !== userId) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const finalProgress = await consolidateCourseProgress({ userId, courseId });
        
        // --- Gamification Logic ---
        if (finalProgress.progressPercentage === 100) {
            await addXp(userId, XP_CONFIG.COMPLETE_COURSE);
            await checkAndAwardCourseCompletionAchievements(userId);
        }
        // --------------------------

        return NextResponse.json(finalProgress);
    } catch (error) {
        console.error('[CONSOLIDATE_PROGRESS_ERROR]', error);
        return NextResponse.json({ message: 'Error al consolidar el progreso del curso' }, { status: 500 });
    }
}
