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
