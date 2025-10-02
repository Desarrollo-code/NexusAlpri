// src/app/api/announcements/[id]/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET a specific announcement
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = params;
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: { 
          author: { select: { id: true, name: true, role: true } },
          attachments: true 
      },
    });

    if (!announcement) {
      return NextResponse.json({ message: 'Anuncio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('[ANNOUNCEMENT_GET_ID_ERROR]', error);
    return NextResponse.json({ message: 'Error al obtener el anuncio' }, { status: 500 });
  }
}

// PUT (update) an announcement
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = params;
    const announcement = await prisma.announcement.findUnique({ where: { id } });

    if (!announcement) {
      return NextResponse.json({ message: 'Anuncio no encontrado' }, { status: 404 });
    }

    if (session.role !== 'ADMINISTRATOR' && announcement.authorId !== session.id) {
      return NextResponse.json({ message: 'No tienes permiso para editar este anuncio' }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, audience, priority, attachments, isPinned } = body;
    
    const audienceToStore = Array.isArray(audience) ? audience[0] : audience;

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (content !== undefined) dataToUpdate.content = content;
    if (audienceToStore !== undefined) dataToUpdate.audience = audienceToStore;
    if (priority !== undefined) dataToUpdate.priority = priority;
    if (isPinned !== undefined) dataToUpdate.isPinned = isPinned === true;
    if (attachments !== undefined) {
      dataToUpdate.attachments = {
        deleteMany: {}, // Clear existing attachments
        create: attachments.map((att: { name: string; url: string; type: string; size: number }) => ({
          name: att.name,
          url: att.url,
          type: att.type,
          size: att.size,
        })),
      };
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: dataToUpdate,
      include: { author: { select: { id: true, name: true, avatar: true, role: true } }, attachments: true, _count: { select: { reads: true, reactions: true } } },
    });

    return NextResponse.json(updatedAnnouncement);
  } catch (error) {
    console.error('[ANNOUNCEMENT_PUT_ERROR]', error);
    return NextResponse.json({ message: 'Error al actualizar el anuncio' }, { status: 500 });
  }
}

// DELETE an announcement
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = params;
    const announcement = await prisma.announcement.findUnique({ where: { id } });

    if (!announcement) {
      return new NextResponse(null, { status: 204 });
    }
    
    if (session.role !== 'ADMINISTRATOR' && announcement.authorId !== session.id) {
      return NextResponse.json({ message: 'No tienes permiso para eliminar este anuncio' }, { status: 403 });
    }
    
    // Use a transaction to delete the announcement and its related notifications
    await prisma.$transaction([
        prisma.notification.deleteMany({
            where: { announcementId: id }
        }),
        prisma.announcement.delete({ 
            where: { id } 
        })
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[ANNOUNCEMENT_DELETE_ERROR]', error);
    if ((error as any).code === 'P2025') {
        return new NextResponse(null, { status: 204 });
    }
    return NextResponse.json({ message: 'Error al eliminar el anuncio' }, { status: 500 });
  }
}
