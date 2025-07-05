
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PUT (update) an event
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = params;
    const body = await req.json();
    
    const updatedEvent = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...body,
        // Ensure attendeeIds are handled correctly if provided
        attendees: body.attendeeIds ? {
          set: body.attendeeIds.map((attendeeId: string) => ({ id: attendeeId }))
        } : undefined
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('[EVENT_PUT_ERROR]', error);
    return NextResponse.json({ message: 'Error al actualizar el evento' }, { status: 500 });
  }
}

// DELETE an event
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const session = await getSession();
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
