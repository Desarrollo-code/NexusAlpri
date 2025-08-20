
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';

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

  const id = params.id;

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
    const { title, description, location, start, end, allDay, audienceType, attendeeIds, color, videoConferenceLink, attachments } = body;

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

    const id = params.id;

    try {
        const existingEvent = await prisma.calendarEvent.findUnique({
            where: { id },
            select: { creatorId: true },
        });

        if (!existingEvent) {
            return NextResponse.json({ message: 'Evento no encontrado' }, { status: 404 });
        }

        if (session.role !== 'ADMINISTRATOR' && existingEvent.creatorId !== session.id) {
            return NextResponse.json({ message: 'No tienes permiso para eliminar este evento.' }, { status: 403 });
        }
        
        await prisma.calendarEvent.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[EVENT_DELETE_ERROR]', error);
        return NextResponse.json({ message: 'Error al eliminar el evento' }, { status: 500 });
    }
}
    
