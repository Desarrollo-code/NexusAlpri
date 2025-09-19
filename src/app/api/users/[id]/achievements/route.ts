// src/app/api/users/[id]/achievements/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    const { id: userId } = params;

    if (!session || (session.id !== userId && session.role !== 'ADMINISTRATOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const userAchievements = await prisma.userAchievement.findMany({
            where: { userId: userId },
            include: {
                achievement: true,
            },
            orderBy: {
                unlockedAt: 'desc'
            }
        });
        return NextResponse.json(userAchievements);
    } catch (error) {
        console.error(`[GET_USER_ACHIEVEMENTS_ERROR]`, error);
        return NextResponse.json({ message: 'Error al obtener los logros del usuario' }, { status: 500 });
    }
}
