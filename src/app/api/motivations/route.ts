// src/app/api/motivations/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all motivational messages
export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const messages = await prisma.motivationalMessage.findMany({
            include: {
                triggerCourse: { select: { id: true, title: true } }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return NextResponse.json(messages);
    } catch (error) {
        console.error("[MOTIVATIONS_GET_ERROR]", error);
        return NextResponse.json({ message: 'Error al obtener los mensajes de motivación' }, { status: 500 });
    }
}
