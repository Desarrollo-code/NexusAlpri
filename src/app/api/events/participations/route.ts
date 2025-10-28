// src/app/api/events/participations/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { startOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get('eventId');
        const occurrenceDateString = searchParams.get('occurrenceDate');

        if (!eventId || !occurrenceDateString) {
            return NextResponse.json({ message: 'eventId y occurrenceDate son requeridos' }, { status: 400 });
        }

        const occurrenceDate = startOfDay(new Date(occurrenceDateString));

        const participations = await prisma.eventParticipation.findMany({
            where: {
                eventId: eventId,
                occurrenceDate: occurrenceDate,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return NextResponse.json(participations);

    } catch (error) {
        console.error('[EVENT_PARTICIPATIONS_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener la lista de participantes' }, { status: 500 });
    }
}