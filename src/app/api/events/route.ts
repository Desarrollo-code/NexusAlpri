// src/app/api/events/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import type { UserRole, EventAudienceType } from '@/types';
import { RecurrenceType } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET all events relevant to the user
export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }
  
  try {
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) {
        return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }
    
    // Base query to fetch events.
    let whereClause: any = {};
    
    // Filter by audience unless the user is an admin
    if (user.role !== 'ADMINISTRATOR') {
        whereClause.OR = [
            { audienceType: 'ALL' },
            { audienceType: user.role as UserRole },
            { attendees: { some: { id: user.id } } },
        ];
    }
    
    const events = await prisma.calendarEvent.findMany({
      where: whereClause,
      include: {
        attendees: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true }
        }
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
  const session = await getCurrentUser();
  // Only ADMINISTRATOR or INSTRUCTOR roles can create events
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, description, location, start, end, allDay, audienceType, attendeeIds, color, videoConferenceLink, attachments, recurrence, recurrenceEndDate } = body;
    
    if (!title || !start || !end || !session.id) {
        return NextResponse.json({ message: 'Faltan campos requeridos (título, inicio, fin, creador).' }, { status: 400 });
    }
    
    // --- CORRECCIÓN: Validar que el valor de recurrencia sea uno de los valores del enum ---
    const validRecurrence = Object.values(RecurrenceType).includes(recurrence) 
        ? recurrence as RecurrenceType 
        : RecurrenceType.NONE;

    const dataToCreate: any = {
      title,
      description,
      location,
      start: new Date(start),
      end: new Date(end),
      allDay,
      audienceType: audienceType as EventAudienceType,
      color,
      videoConferenceLink,
      attachments,
      recurrence: validRecurrence,
      recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
      creator: {
        connect: { id: session.id },
      },
    };

    if (audienceType === 'SPECIFIC' && attendeeIds && Array.isArray(attendeeIds) && attendeeIds.length > 0) {
      dataToCreate.attendees = {
        connect: attendeeIds.map((attendeeId: string) => ({ id: attendeeId })),
      };
    }
    
    const newEvent = await prisma.calendarEvent.create({
      data: dataToCreate,
      include: {
        attendees: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true }
        }
      }
    });
    
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('[EVENT_POST_ERROR]', error);
    return NextResponse.json({ message: 'Error al crear el evento' }, { status: 500 });
  }
}
