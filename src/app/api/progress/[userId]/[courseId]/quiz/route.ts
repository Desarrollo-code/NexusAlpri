
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { recordLessonInteraction } from '@/lib/progress';

// Records a 'quiz' interaction with its score
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
        
        await recordLessonInteraction({
            userId,
            courseId,
            lessonId,
            type: 'quiz',
            score,
        });

        const message = score >= 80 ? 'Quiz aprobado.' : 'Quiz enviado.';
        return NextResponse.json({ message });

    } catch (error) {
        console.error('[QUIZ_SUBMIT_ERROR]', error);
        return NextResponse.json({ message: 'Error al procesar el resultado del quiz' }, { status: 500 });
    }
}
