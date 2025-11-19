// src/app/api/quizzes/[quizId]/attempts/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();
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
        const attempts = await prisma.quizAttempt.findMany({
            where: {
                quizId,
                userId,
            },
            orderBy: {
                attemptNumber: 'asc'
            }
        });

        return NextResponse.json({ attempts });

    } catch (error) {
        console.error(`[QUIZ_ATTEMPTS_GET_ERROR]`, error);
        return NextResponse.json({ message: 'Error al obtener los intentos del quiz' }, { status: 500 });
    }
}
