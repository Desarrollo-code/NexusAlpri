
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';

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
          { audienceType: user.role },
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
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { attendeeIds, ...restOfBody } = body;
    
    const dataToCreate: any = {
      ...restOfBody,
    };

    if (attendeeIds && Array.isArray(attendeeIds) && attendeeIds.length > 0) {
      dataToCreate.attendees = {
        connect: attendeeIds.map((attendeeId: string) => ({ id: attendeeId })),
      };
    }
    
    const newEvent = await prisma.calendarEvent.create({
      data: dataToCreate,
    });
    
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('[EVENT_POST_ERROR]', error);
    return NextResponse.json({ message: 'Error al crear el evento' }, { status: 500 });
  }
}
