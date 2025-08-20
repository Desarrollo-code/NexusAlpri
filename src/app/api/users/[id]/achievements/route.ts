// src/app/api/users/[id]/achievements/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, context: { params: { id: string } }) {
    const session = await getCurrentUser();
    const { id: userId } = context.params;

    if (!session || session.id !== userId) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const userAchievements = await prisma.userAchievement.findMany({
            where: { userId },
            include: {
                achievement: true, // Incluye los detalles del logro
            },
            orderBy: {
                earnedAt: 'desc',
            },
        });

        return NextResponse.json(userAchievements);
    } catch (error) {
        console.error(`[USER_ACHIEVEMENTS_GET_ERROR] for user ${userId}:`, error);
        return NextResponse.json({ message: 'Error al obtener los logros del usuario' }, { status: 500 });
    }
}
