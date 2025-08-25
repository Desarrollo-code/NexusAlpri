
// src/app/api/progress/[userId]/[courseId]/quiz/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { recordLessonInteraction } from '@/lib/progress';
import prisma from '@/lib/prisma';
import { addXp, awardAchievement, XP_CONFIG, ACHIEVEMENT_SLUGS } from '@/lib/gamification';

// Records a 'quiz' interaction with its score and individual answers
export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string, courseId: string }> }) {
    const session = await getCurrentUser();
    const { userId, courseId } = await params;

    if (!session || session.id !== userId) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { lessonId, quizId, answers } = await req.json();

        if (!lessonId || !quizId || !answers) {
            return NextResponse.json({ message: 'lessonId, quizId y answers son requeridos.' }, { status: 400 });
        }
        
        // Check attempt limit
        const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
        if (quiz?.maxAttempts !== null) {
            const attemptCount = await prisma.quizAttempt.count({ where: { userId, quizId }});
            if (attemptCount >= quiz.maxAttempts) {
                return NextResponse.json({ message: 'Has alcanzado el número máximo de intentos para este quiz.' }, { status: 403 });
            }
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
            const correctOption = question.options.find(o => o.isCorrect);
            const userAnswer = answers[question.id];
            if (correctOption && userAnswer === correctOption.id) {
                correctCount++;
            }
        }
        
        const score = (correctCount / questions.length) * 100;
        
        const currentAttempts = await prisma.quizAttempt.count({ where: { userId, quizId } });

        // Record the general lesson interaction (for overall course progress)
        await recordLessonInteraction({
            userId,
            courseId,
            lessonId,
            type: 'quiz',
            score,
        });

        // --- Gamification Logic ---
        await addXp(userId, XP_CONFIG.COMPLETE_QUIZ);
        if (score >= 80) {
            await addXp(userId, XP_CONFIG.PASS_QUIZ);
        }
        if (score === 100) {
            await awardAchievement({ userId, slug: ACHIEVEMENT_SLUGS.PERFECT_SCORE });
        }
        // --------------------------

        // Save the detailed quiz attempt
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
