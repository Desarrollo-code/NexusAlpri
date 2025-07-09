
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { updateLessonCompletionStatus } from '@/lib/progress';

const PASSING_SCORE = 80; // 80% to pass the quiz

// Submit quiz result and update progress
export async function POST(req: NextRequest, context: { params: { userId: string, courseId: string } }) {
    const session = await getSession(req);
    const { userId, courseId } = context.params;

    if (!session || session.id !== userId) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { lessonId, score } = await req.json();

        if (typeof score !== 'number' || !lessonId) {
            return NextResponse.json({ message: 'lessonId y score son requeridos.' }, { status: 400 });
        }
        
        // Mark the lesson as complete regardless of the score
        const updatedProgress = await updateLessonCompletionStatus(userId, courseId, lessonId, true);

        const passed = score >= PASSING_SCORE;
        const message = passed
            ? 'Quiz aprobado y progreso actualizado.'
            : 'Quiz enviado. Tu progreso ha sido actualizado.';

        return NextResponse.json({ message, passed, progress: updatedProgress });

    } catch (error) {
        console.error('[QUIZ_SUBMIT_ERROR]', error);
        return NextResponse.json({ message: 'Error al procesar el resultado del quiz' }, { status: 500 });
    }
}
