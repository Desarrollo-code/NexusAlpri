// src/app/api/events/participate/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { startOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        const { eventId, occurrenceDate: occurrenceDateString } = await req.json();

        if (!eventId || !occurrenceDateString) {
            return NextResponse.json({ message: 'eventId y occurrenceDate son requeridos' }, { status: 400 });
        }
        
        // Normalizamos la fecha a la medianoche para asegurar consistencia
        const occurrenceDate = startOfDay(new Date(occurrenceDateString));

        // Usamos upsert para evitar crear entradas duplicadas
        await prisma.eventParticipation.upsert({
            where: {
                userId_eventId_occurrenceDate: {
                    userId: session.id,
                    eventId: eventId,
                    occurrenceDate: occurrenceDate,
                }
            },
            update: {}, // No se necesita actualizar nada si ya existe
            create: {
                userId: session.id,
                eventId: eventId,
                occurrenceDate: occurrenceDate,
            }
        });
        
        // Marcamos la notificación correspondiente como leída
        await prisma.notification.updateMany({
            where: {
                userId: session.id,
                interactiveEventId: eventId,
                interactiveEventOccurrence: occurrenceDate,
            },
            data: {
                read: true,
            }
        });

        return NextResponse.json({ message: 'Participación confirmada' }, { status: 201 });

    } catch (error) {
        console.error('[EVENT_PARTICIPATE_ERROR]', error);
        return NextResponse.json({ message: 'Error al confirmar la participación' }, { status: 500 });
    }
}
