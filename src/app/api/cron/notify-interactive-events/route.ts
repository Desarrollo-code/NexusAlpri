
// src/app/api/cron/notify-interactive-events/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { expandRecurringEvents } from '@/lib/calendar-utils';
import type { CalendarEvent, UserRole } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de CRON para notificar sobre eventos interactivos del día.
 * Se debe proteger con un CRON_SECRET en las variables de entorno.
 * Vercel Cron Job: /api/cron/notify-interactive-events?cron_secret=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cronSecret = searchParams.get('cron_secret');

  // 1. Proteger el endpoint
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
  }

  try {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // 2. Buscar eventos base que son interactivos y podrían ocurrir hoy
    const baseInteractiveEvents = await prisma.calendarEvent.findMany({
      where: {
        isInteractive: true,
        // Filtramos para optimizar: eventos que no son recurrentes y caen hoy,
        // o eventos recurrentes que no han terminado.
        OR: [
          {
            recurrence: 'NONE',
            start: { lte: todayEnd, gte: todayStart },
          },
          {
            recurrence: { not: 'NONE' },
            OR: [
              { recurrenceEndDate: null },
              { recurrenceEndDate: { gte: todayStart } },
            ]
          }
        ]
      },
      include: {
        attendees: { select: { id: true, name: true, email: true } },
      }
    });

    if (baseInteractiveEvents.length === 0) {
      return NextResponse.json({ message: 'No hay eventos interactivos programados para hoy.' });
    }

    // 3. Expandir los eventos recurrentes para obtener las ocurrencias de hoy
    const todaysOccurrences = expandRecurringEvents(baseInteractiveEvents as CalendarEvent[], todayStart, todayEnd);

    if (todaysOccurrences.length === 0) {
      return NextResponse.json({ message: 'Ninguna de las recurrencias de eventos interactivos cae hoy.' });
    }

    let notificationsCreated = 0;

    // 4. Para cada ocurrencia de hoy, buscar los usuarios y crear la notificación
    for (const event of todaysOccurrences) {
      let targetUserIds: string[] = [];

      if (event.audienceType === 'SPECIFIC') {
        targetUserIds = event.attendees.map(a => a.id);
      } else {
        const usersInAudience = await prisma.user.findMany({
            where: event.audienceType === 'ALL' ? { isActive: true } : { role: event.audienceType as UserRole, isActive: true },
            select: { id: true }
        });
        targetUserIds = usersInAudience.map(u => u.id);
      }

      if (targetUserIds.length > 0) {
        const notificationsToCreate = targetUserIds.map(userId => ({
          userId,
          title: `¡Es hora de tu Pausa Activa!`,
          description: `Confirma tu participación en "${event.title}" para ganar puntos de experiencia.`,
          link: '/dashboard', // La alerta se verá en el dashboard
          isMotivational: false,
          interactiveEventId: event.parentId || event.id, // Usamos el ID del evento base
          interactiveEventOccurrence: startOfDay(new Date(event.start)), // La fecha de la ocurrencia
        }));
        
        const result = await prisma.notification.createMany({
          data: notificationsToCreate,
          skipDuplicates: true,
        });
        notificationsCreated += result.count;
      }
    }

    return NextResponse.json({
      message: `Proceso completado. Se crearon ${notificationsCreated} notificaciones interactivas.`,
    });

  } catch (error) {
    console.error('[CRON_NOTIFY_INTERACTIVE_EVENTS_ERROR]', error);
    return NextResponse.json({ message: 'Error al procesar los eventos interactivos.', error: (error as Error).message }, { status: 500 });
  }
}
