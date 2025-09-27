// src/app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const calculateLevel = (xp: number) => {
    const baseXP = 250;
    const exponent = 1.5;
    let level = 1;
    let requiredXP = baseXP;
    while (xp >= requiredXP) {
        level++;
        xp -= requiredXP;
        requiredXP = Math.floor(baseXP * Math.pow(level, exponent));
    }
    return level;
};

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            where: {
                isActive: true,
                xp: {
                    gt: 0,
                },
            },
            select: {
                id: true,
                name: true,
                avatar: true,
                xp: true,
            },
            orderBy: {
                xp: 'desc',
            },
            take: 100, // Top 100
        });

        const rankedUsers = users.map((user, index) => ({
            rank: index + 1,
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            xp: user.xp || 0,
            level: calculateLevel(user.xp || 0),
        }));

        return NextResponse.json(rankedUsers);

    } catch (error) {
        console.error('[LEADERBOARD_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener la tabla de clasificación' }, { status: 500 });
    }
}
