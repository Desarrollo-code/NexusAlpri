
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';

// PUT (update) an event
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req);
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = params;
    const body = await req.json();
    const { attendeeIds, ...restOfBody } = body;

    const dataToUpdate: any = {
      ...restOfBody,
    };

    // Use 'set' to replace the list of attendees with the new one.
    if (attendeeIds && Array.isArray(attendeeIds)) {
      dataToUpdate.attendees = {
        set: attendeeIds.map((attendeeId: string) => ({ id: attendeeId })),
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
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getSession(req);
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { id } = params;
        await prisma.calendarEvent.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[EVENT_DELETE_ERROR]', error);
        return NextResponse.json({ message: 'Error al eliminar el evento' }, { status: 500 });
    }
}
