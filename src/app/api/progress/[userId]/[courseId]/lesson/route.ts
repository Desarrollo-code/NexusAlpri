import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { recordLessonInteraction } from '@/lib/progress';
import { addXp, XP_CONFIG } from '@/lib/gamification';

// Records a 'view' interaction for a lesson
export async function POST(req: NextRequest, context: { params: { userId: string, courseId: string } }) {
    const session = await getCurrentUser();
    const { userId, courseId } = context.params;

    if (!session || session.id !== userId) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { lessonId } = await req.json();
        if (!lessonId) {
            return NextResponse.json({ message: 'lessonId es requerido.' }, { status: 400 });
        }
        
        await recordLessonInteraction({
            userId,
            courseId,
            lessonId,
            type: 'view',
        });

        // --- Gamification Logic ---
        await addXp(userId, XP_CONFIG.COMPLETE_LESSON);
        // --------------------------
        
        return NextResponse.json({ message: "Interaction recorded" });

    } catch (error) {
        console.error('[PROGRESS_LESSON_ERROR]', error);
        return NextResponse.json({ message: 'Error al registrar la interacción' }, { status: 500 });
    }
}
