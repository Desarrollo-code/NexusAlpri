import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';

// PUT (update) an event
export async function PUT(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  const session = await getSession(req);
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

    if (existingEvent.creatorId !== session.id && session.role !== 'ADMINISTRATOR') {
      return NextResponse.json({ message: 'No tienes permiso para actualizar este evento' }, { status: 403 });
    }
    
    const body = await req.json();
    const { title, description, location, start, end, allDay, audienceType, attendeeIds, color } = body;

    const dataToUpdate: any = {
      title,
      description,
      location,
      start: new Date(start),
      end: new Date(end),
      allDay,
      audienceType,
      color,
    };

    if (attendeeIds && Array.isArray(attendeeIds)) {
      dataToUpdate.attendees = {
        set: attendeeIds.map((attendeeId: string) => ({ id: attendeeId })),
      };
    } else {
      dataToUpdate.attendees = {
        set: [],
      };
    }

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id },
      data: dataToUpdate,
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
    const session = await getSession(req);
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

        if (existingEvent.creatorId !== session.id && session.role !== 'ADMINISTRATOR') {
            return NextResponse.json({ message: 'No tienes permiso para eliminar este evento' }, { status: 403 });
        }
        
        await prisma.calendarEvent.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[EVENT_DELETE_ERROR]', error);
        return NextResponse.json({ message: 'Error al eliminar el evento' }, { status: 500 });
    }
}
