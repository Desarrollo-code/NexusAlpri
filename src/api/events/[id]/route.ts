// src/app/api/events/[id]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { RecurrenceType } from '@prisma/client';
import { supabaseAdmin } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

// PUT (update) an event
export async function PUT(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const { id } = params;

  try {
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!existingEvent) {
      return NextResponse.json({ message: 'Evento no encontrado' }, { status: 404 });
    }

    if (session.role !== 'ADMINISTRATOR' && existingEvent.creatorId !== session.id) {
      return NextResponse.json({ message: 'No tienes permiso para actualizar este evento.' }, { status: 403 });
    }
    
    const body = await req.json();
    const { title, description, location, start, end, allDay, audienceType, attendeeIds, color, videoConferenceLink, attachments, recurrence, recurrenceEndDate, isInteractive, imageUrl } = body;

    const dataToUpdate: any = {
      title,
      description,
      location,
      start: new Date(start),
      end: new Date(end),
      allDay,
      audienceType,
      color,
      videoConferenceLink,
      attachments,
      recurrence: recurrence as RecurrenceType || RecurrenceType.NONE,
      recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
      isInteractive,
      imageUrl,
    };

    if (attendeeIds && Array.isArray(attendeeIds)) {
      dataToUpdate.attendees = {
        set: attendeeIds.map((attendeeId: string) => ({ id: attendeeId })),
      };
    } else if (attendeeIds === null) { // Handle clearing attendees
      dataToUpdate.attendees = {
        set: [],
      };
    }


    const updatedEvent = await prisma.calendarEvent.update({
      where: { id },
      data: dataToUpdate,
      include: {
        attendees: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('[EVENT_PUT_ERROR]', error);
    return NextResponse.json({ message: 'Error al actualizar el evento' }, { status: 500 });
  }
}

// DELETE an event
export async function DELETE(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { id } = params;

    try {
        const existingEvent = await prisma.calendarEvent.findUnique({
            where: { id },
            select: { creatorId: true },
        });

        if (!existingEvent) {
            return new NextResponse(null, { status: 204 });
        }

        if (session.role !== 'ADMINISTRATOR' && existingEvent.creatorId !== session.id) {
            return NextResponse.json({ message: 'No tienes permiso para eliminar este evento.' }, { status: 403 });
        }
        
        await prisma.$transaction([
            prisma.notification.deleteMany({
                where: { 
                  OR: [
                    { interactiveEventId: id },
                    { link: `/calendar?eventId=${id}` }
                  ]
                }
            }),
            prisma.calendarEvent.delete({ where: { id } })
        ]);

        if (supabaseAdmin) {
            const channel = supabaseAdmin.channel('events');
            await channel.send({
                type: 'broadcast',
                event: 'event_deleted',
                payload: { id },
            });
        }
        
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[EVENT_DELETE_ERROR]', error);
        return NextResponse.json({ message: 'Error al eliminar el evento' }, { status: 500 });
    }
}
