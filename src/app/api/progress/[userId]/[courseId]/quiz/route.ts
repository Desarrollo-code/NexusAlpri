
// src/app/api/progress/[userId]/[courseId]/quiz/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { recordLessonInteraction } from '@/lib/progress';
import { PrismaClient } from '@prisma/client';
import { addXp, awardAchievement, XP_CONFIG, ACHIEVEMENT_SLUGS } from '@/lib/gamification';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

// Records a 'quiz' interaction with its score and individual answers
export async function POST(req: NextRequest, { params }: { params: { userId: string, courseId: string } }) {
    const session = await getCurrentUser();
    const { userId, courseId } = params;

    if (!session || session.id !== userId) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { lessonId, quizId, answers } = await req.json();

        if (!lessonId || !quizId || !answers) {
            return NextResponse.json({ message: 'lessonId, quizId y answers son requeridos.' }, { status: 400 });
        }
        
        const quiz = await prisma.quiz.findUnique({ 
            where: { id: quizId },
            include: { questions: { include: { options: true } } }
        });
        
        if (!quiz) {
            return NextResponse.json({ message: "Quiz no encontrado." }, { status: 404 });
        }
        
        // Check attempt limit
        if (quiz?.maxAttempts !== null) {
            const attemptCount = await prisma.quizAttempt.count({ where: { userId, quizId }});
            if (attemptCount >= quiz.maxAttempts) {
                return NextResponse.json({ message: 'Has alcanzado el número máximo de intentos para este quiz.' }, { status: 403 });
            }
        }

        let correctCount = 0;
        for (const question of quiz.questions) {
            const correctOption = question.options.find(o => o.isCorrect);
            const userAnswer = answers[question.id];
            if (correctOption && userAnswer === correctOption.id) {
                correctCount++;
            }
        }
        
        const score = quiz.questions.length > 0 ? (correctCount / quiz.questions.length) * 100 : 0;
        
        // 1. Guardar la nota en el registro de la lección y recalcular progreso
        await recordLessonInteraction({
            userId,
            courseId,
            lessonId,
            type: 'quiz',
            score,
        });

        // --- Gamification Logic ---
        await addXp(userId, XP_CONFIG.COMPLETE_QUIZ);
        if (score >= 80) await addXp(userId, XP_CONFIG.PASS_QUIZ);
        if (score === 100) await awardAchievement({ userId, slug: ACHIEVEMENT_SLUGS.PERFECT_SCORE });
        
        const currentAttempts = await prisma.quizAttempt.count({ where: { userId, quizId } });
        // 2. Guardar el intento detallado (para analíticas futuras)
        const newAttempt = await prisma.quizAttempt.create({
            data: {
                userId,
                quizId,
                attemptNumber: currentAttempts + 1,
                score,
                answers: {
                    create: Object.entries(answers).map(([questionId, selectedOptionId]) => ({
                        questionId: questionId as string,
                        selectedOptionId: selectedOptionId as string,
                    }))
                }
            }
        });

        const message = score >= 80 ? 'Quiz aprobado.' : 'Quiz enviado.';
        return NextResponse.json({ message, attemptId: newAttempt.id, score });

    } catch (error) {
        console.error('[QUIZ_SUBMIT_ERROR]', error);
        return NextResponse.json({ message: 'Error al procesar el resultado del quiz' }, { status: 500 });
    }
}
