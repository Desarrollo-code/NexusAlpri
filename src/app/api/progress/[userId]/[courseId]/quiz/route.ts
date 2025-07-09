import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { updateLessonCompletionStatus } from '@/lib/progress';

const PASSING_SCORE = 80; // 80% to pass the quiz

// Submit quiz result and update progress if passed
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

        if (score >= PASSING_SCORE) {
            // If the user passed, mark the lesson as complete.
            const updatedProgress = await updateLessonCompletionStatus(userId, courseId, lessonId, true);
            return NextResponse.json({ message: 'Quiz aprobado y progreso actualizado.', passed: true, progress: updatedProgress });
        } else {
            // If the user failed, we just acknowledge the submission without changing progress.
            return NextResponse.json({ message: 'Quiz enviado, pero no aprobado.', passed: false });
        }

    } catch (error) {
        console.error('[QUIZ_SUBMIT_ERROR]', error);
        return NextResponse.json({ message: 'Error al procesar el resultado del quiz' }, { status: 500 });
    }
}
