
// src/app/api/progress/[userId]/[courseId]/quiz/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { recordLessonInteraction } from '@/lib/progress';
import prisma from '@/lib/prisma';

// Records a 'quiz' interaction with its score and individual answers
export async function POST(req: NextRequest, context: { params: { userId: string, courseId: string } }) {
    const session = await getCurrentUser();
    const { userId, courseId } = context.params;

    if (!session || session.id !== userId) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { lessonId, quizId, answers } = await req.json();

        if (!lessonId || !quizId || !answers) {
            return NextResponse.json({ message: 'lessonId, quizId y answers son requeridos.' }, { status: 400 });
        }

        const questions = await prisma.question.findMany({
            where: { quizId: quizId },
            include: { options: true }
        });

        if (questions.length === 0) {
            return NextResponse.json({ message: "No se encontraron preguntas para este quiz." }, { status: 404 });
        }

        let correctCount = 0;
        for (const question of questions) {
            const correctAnswer = question.options.find(o => o.isCorrect);
            const userAnswer = answers[question.id];
            if (correctAnswer && userAnswer === correctAnswer.id) {
                correctCount++;
            }
        }
        
        const score = (correctCount / questions.length) * 100;

        // Record the general lesson interaction (for overall course progress)
        await recordLessonInteraction({
            userId,
            courseId,
            lessonId,
            type: 'quiz',
            score,
        });

        // Save the detailed quiz attempt
        const newAttempt = await prisma.quizAttempt.create({
            data: {
                userId,
                quizId,
                score,
                answers: {
                    create: Object.entries(answers).map(([questionId, selectedOptionId]) => ({
                        questionId: questionId as string,
                        selectedOptionId: selectedOptionId as string,
                    }))
                }
            },
            include: {
                answers: true
            }
        });

        const message = score >= 80 ? 'Quiz aprobado.' : 'Quiz enviado.';
        return NextResponse.json({ message, attemptId: newAttempt.id });

    } catch (error) {
        console.error('[QUIZ_SUBMIT_ERROR]', error);
        return NextResponse.json({ message: 'Error al procesar el resultado del quiz' }, { status: 500 });
    }
}
