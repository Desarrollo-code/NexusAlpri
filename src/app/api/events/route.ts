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
    const { title, description, location, start, end, allDay, audienceType, attendeeIds, color, creatorId } = body;
    
    if (!title || !start || !end || !creatorId) {
        return NextResponse.json({ message: 'Faltan campos requeridos (título, inicio, fin, creador).' }, { status: 400 });
    }

    // Prepare data for event creation
    const dataToCreate: any = {
      title,
      description,
      location,
      start: new Date(start),
      end: new Date(end),
      allDay,
      audienceType,
      color,
      creatorId,
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
