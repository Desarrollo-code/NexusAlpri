// src/app/api/analytics/quiz/[quizId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
import { checkCourseOwnership } from '@/lib/auth-utils';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { quizId: string } }) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { quizId } = params;

    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: { 
                questions: { select: { id: true, text: true, order: true } },
                contentBlock: { select: { lesson: { select: { module: { select: { courseId: true } } } } } }
            },
        });

        if (!quiz) {
            return NextResponse.json({ message: 'Quiz no encontrado' }, { status: 404 });
        }

        // Permission check
        const courseId = quiz.contentBlock?.lesson?.module?.courseId;
        if (!courseId || !(await checkCourseOwnership(session, courseId))) {
            return NextResponse.json({ message: 'No tienes permiso para ver las analíticas de este quiz.' }, { status: 403 });
        }

        const attempts = await prisma.quizAttempt.findMany({
            where: { quizId: quizId },
            include: {
                answers: {
                    include: {
                        question: { select: { id: true } },
                        selectedOption: { select: { id: true, isCorrect: true } },
                    }
                }
            }
        });

        if (attempts.length === 0) {
            return NextResponse.json({
                quizTitle: quiz.title,
                totalAttempts: 0,
                averageScore: 0,
                questionAnalytics: [],
            });
        }
        
        const totalAttempts = attempts.length;
        const averageScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts;

        const questionAnalytics = await Promise.all(
            quiz.questions.map(async (question) => {
                const questionAttempts = await prisma.answerAttempt.findMany({
                    where: { questionId: question.id },
                    include: { selectedOption: true }
                });

                const totalAnswers = questionAttempts.length;
                const correctAnswers = questionAttempts.filter(a => a.selectedOption.isCorrect).length;
                const successRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
                
                const optionsBreakdown = await prisma.answerOption.findMany({
                    where: { questionId: question.id },
                    select: { id: true, text: true, isCorrect: true, _count: { select: { AnswerAttempt: true } } }
                });

                return {
                    questionId: question.id,
                    questionText: question.text,
                    order: question.order,
                    successRate,
                    totalAnswers,
                    options: optionsBreakdown.map(opt => ({
                        optionId: opt.id,
                        text: opt.text,
                        isCorrect: opt.isCorrect,
                        selectionCount: opt._count.AnswerAttempt,
                        selectionPercentage: totalAnswers > 0 ? (opt._count.AnswerAttempt / totalAnswers) * 100 : 0
                    }))
                };
            })
        );
        
        questionAnalytics.sort((a,b) => a.order - b.order);

        return NextResponse.json({
            quizId: quiz.id,
            quizTitle: quiz.title,
            totalAttempts,
            averageScore: Math.round(averageScore),
            questionAnalytics
        });

    } catch (error) {
        console.error(`[QUIZ_ANALYTICS_ERROR]`, error);
        return NextResponse.json({ message: 'Error al obtener las analíticas del quiz' }, { status: 500 });
    }
}
