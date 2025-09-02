import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { recordLessonInteraction, recalculateProgress } from '@/lib/progress';
import { addXp, XP_CONFIG } from '@/lib/gamification';

export const dynamic = 'force-dynamic';

// Records a 'view' interaction for a lesson and recalculates progress
export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string, courseId: string }> }) {
    const session = await getCurrentUser();
    const { userId, courseId } = await params;

    if (!session || session.id !== userId) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { lessonId, type } = await req.json(); // Se añade 'type' para videos
        if (!lessonId) {
            return NextResponse.json({ message: 'lessonId es requerido.' }, { status: 400 });
        }
        
        const interactionRecorded = await recordLessonInteraction({
            userId,
            courseId,
            lessonId,
            type: type === 'video' ? 'video' : 'view',
        });
        
        // Recalculate progress after the interaction
        const updatedProgress = await recalculateProgress({ userId, courseId });

        // --- Gamification Logic ---
        if (interactionRecorded) {
            await addXp(userId, XP_CONFIG.COMPLETE_LESSON);
        }
        // --------------------------
        
        return NextResponse.json({ message: "Interaction recorded", progress: updatedProgress });

    } catch (error) {
        console.error('[PROGRESS_LESSON_ERROR]', error);
        return NextResponse.json({ message: 'Error al registrar la interacción' }, { status: 500 });
    }
}
