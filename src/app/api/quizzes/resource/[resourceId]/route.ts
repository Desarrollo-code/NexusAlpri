// src/app/api/quizzes/resource/[resourceId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { AppQuestion, FormFieldOption } from '@/types';
import { checkResourceOwnership } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

// GET quiz for a resource
export async function GET(req: NextRequest, { params }: { params: { resourceId: string } }) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    
    const { resourceId } = params;

    const hasPermission = await checkResourceOwnership(session, resourceId);
    if (!hasPermission) {
        return NextResponse.json({ message: 'No tienes permiso para acceder a este quiz.' }, { status: 403 });
    }

    try {
        const quiz = await prisma.quiz.findUnique({
            where: { resourceId: resourceId },
            include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } }
        });

        if (!quiz) {
            return NextResponse.json({ message: 'Quiz no encontrado para este recurso' }, { status: 404 });
        }
        
        // Ensure options have string IDs for the client
        const quizWithClientIds = {
            ...quiz,
            questions: quiz.questions.map(q => ({
                ...q,
                options: q.options.map(o => ({...o, id: String(o.id)}))
            }))
        }

        return NextResponse.json(quizWithClientIds);
    } catch (error) {
        console.error(`[GET_QUIZ_RESOURCE_ERROR: ${resourceId}]`, error);
        return NextResponse.json({ message: 'Error al obtener el quiz' }, { status: 500 });
    }
}

// POST (create or update) a quiz for a resource
export async function POST(req: NextRequest, { params }: { params: { resourceId: string } }) {
    const session = await getCurrentUser();
    const { resourceId } = params;
    
    const hasPermission = await checkResourceOwnership(session, resourceId);
    if (!hasPermission) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    
    try {
        const body = await req.json();
        const { title, questions } = body;

        if (!title || !Array.isArray(questions)) {
            return NextResponse.json({ message: 'Datos de quiz inválidos' }, { status: 400 });
        }
        
        const quizData = {
            title,
            resourceId,
            questions: {
                deleteMany: {},
                create: questions.map((q: AppQuestion) => ({
                    text: q.text,
                    timestamp: q.timestamp,
                    order: q.order,
                    type: 'SINGLE_CHOICE', // Forzado por ahora
                    options: {
                        create: q.options.map((opt: FormFieldOption) => ({
                            text: opt.text,
                            isCorrect: opt.isCorrect,
                            points: opt.points || 0
                        }))
                    }
                }))
            }
        };

        const updatedQuiz = await prisma.quiz.upsert({
            where: { resourceId },
            create: quizData,
            update: quizData,
            include: { questions: { include: { options: true } } }
        });

        return NextResponse.json(updatedQuiz, { status: 200 });

    } catch (error) {
        console.error(`[POST_QUIZ_RESOURCE_ERROR: ${resourceId}]`, error);
        return NextResponse.json({ message: 'Error al guardar el quiz' }, { status: 500 });
    }
}