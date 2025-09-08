// src/app/api/quizzes/[quizId]/attempts/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { quizId: string } }) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const session = await getCurrentUser();
    if (!session || session.id !== userId) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { quizId } = params;

    try {
        const count = await prisma.quizAttempt.count({
            where: {
                quizId,
                userId,
            }
        });

        return NextResponse.json({ count });

    } catch (error) {
        console.error(`[QUIZ_ATTEMPTS_COUNT_ERROR]`, error);
        return NextResponse.json({ message: 'Error al contar los intentos del quiz' }, { status: 500 });
    }
}
