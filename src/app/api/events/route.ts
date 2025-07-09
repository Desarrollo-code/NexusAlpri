import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import type { UserRole } from '@/types';

// GET all events relevant to the user
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }
  
  try {
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) {
        return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }
    
    // Fetch events based on user's role and specific invitations
    const events = await prisma.calendarEvent.findMany({
      where: {
        OR: [
          { audienceType: 'ALL' },
          { audienceType: user.role as UserRole }, // Cast user.role to UserRole type
          { attendees: { some: { id: user.id } } },
        ],
      },
      include: {
        attendees: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        start: 'asc',
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('[EVENTS_GET_ERROR]', error);
    return NextResponse.json({ message: 'Error al obtener los eventos' }, { status: 500 });
  }
}

// POST (create) a new event
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  // Only ADMINISTRATOR or INSTRUCTOR roles can create events
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { attendeeIds, ...restOfBody } = body;
    
    // Prepare data for event creation
    const dataToCreate: any = {
      ...restOfBody,
      creatorId: session.id, // Assign creator from session
    };

    // If attendee IDs are provided, connect them to the event
    if (attendeeIds && Array.isArray(attendeeIds) && attendeeIds.length > 0) {
      dataToCreate.attendees = {
        connect: attendeeIds.map((attendeeId: string) => ({ id: attendeeId })),
      };
    }
    
    // Create the new calendar event in the database
    const newEvent = await prisma.calendarEvent.create({
      data: dataToCreate,
    });
    
    return NextResponse.json(newEvent, { status: 201 }); // Return created event with 201 status
  } catch (error) {
    console.error('[EVENT_POST_ERROR]', error);
    return NextResponse.json({ message: 'Error al crear el evento' }, { status: 500 });
  }
}

// PUT (update) an existing event by ID
// Corrected signature to avoid the 'params should be awaited' warning
export async function PUT(
  req: NextRequest, 
  { params }: { params: { id: string } } // Directly destructure params here
) {
  const session = await getSession(req);
  // Only ADMINISTRATOR or INSTRUCTOR roles can update events
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const { id } = params; // Now this line will not trigger the warning

  try {
    const body = await req.json();
    const { attendeeIds, ...restOfBody } = body;

    // Check if the event exists and the user is authorized to modify it (creator or admin)
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!existingEvent) {
      return NextResponse.json({ message: 'Evento no encontrado' }, { status: 404 });
    }

    // Ensure only the creator or an admin can update the event
    if (existingEvent.creatorId !== session.id && session.role !== 'ADMINISTRATOR') {
      return NextResponse.json({ message: 'No autorizado para actualizar este evento' }, { status: 403 });
    }
    
    // Prepare data for event update
    const dataToUpdate: any = {
      ...restOfBody,
    };

    // Handle attendees connection/disconnection
    if (attendeeIds) {
      // First, disconnect all existing attendees to handle removals
      await prisma.calendarEvent.update({
        where: { id },
        data: {
          attendees: {
            set: [], // Disconnect all
          },
        },
      });
      // Then, connect the new set of attendees
      dataToUpdate.attendees = {
        connect: attendeeIds.map((attendeeId: string) => ({ id: attendeeId })),
      };
    } else {
        // If attendeeIds is explicitly null or undefined, ensure attendees are cleared
        dataToUpdate.attendees = { set: [] };
    }
    
    // Update the calendar event in the database
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

// DELETE an event by ID
export async function DELETE(
  req: NextRequest, 
  { params }: { params: { id: string } } // Directly destructure params here
) {
  const session = await getSession(req);
  // Only ADMINISTRATOR or INSTRUCTOR roles can delete events
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const { id } = params; // Now this line will not trigger the warning

  try {
    // Check if the event exists and the user is authorized to delete it (creator or admin)
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!existingEvent) {
      return NextResponse.json({ message: 'Evento no encontrado' }, { status: 404 });
    }

    // Ensure only the creator or an admin can delete the event
    if (existingEvent.creatorId !== session.id && session.role !== 'ADMINISTRATOR') {
      return NextResponse.json({ message: 'No autorizado para eliminar este evento' }, { status: 403 });
    }

    // Delete the calendar event from the database
    await prisma.calendarEvent.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Evento eliminado exitosamente' }, { status: 200 });
  } catch (error) {
    console.error('[EVENT_DELETE_ERROR]', error);
    return NextResponse.json({ message: 'Error al eliminar el evento' }, { status: 500 });
  }
}
