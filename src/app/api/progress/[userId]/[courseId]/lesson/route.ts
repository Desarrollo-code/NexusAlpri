import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { updateLessonCompletionStatus } from '@/lib/progress';

// Update lesson completion status manually
export async function POST(req: NextRequest, context: { params: { userId: string, courseId: string } }) {
    const session = await getSession(req);
    const { userId, courseId } = context.params;

    if (!session || session.id !== userId) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { lessonId, completed } = await req.json();

        if (typeof completed !== 'boolean' || !lessonId) {
            return NextResponse.json({ message: 'lessonId y el estado "completed" son requeridos.' }, { status: 400 });
        }
        
        // This endpoint now only handles 'view' type completions
        const updatedProgress = await updateLessonCompletionStatus({
            userId,
            courseId,
            lessonId,
            type: 'view',
        });
        
        return NextResponse.json(updatedProgress);

    } catch (error) {
        console.error('[PROGRESS_LESSON_ERROR]', error);
        return NextResponse.json({ message: 'Error al actualizar el progreso' }, { status: 500 });
    }
}
