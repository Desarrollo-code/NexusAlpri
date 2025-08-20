
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = context.params;
    const announcement = await prisma.announcement.findUnique({ where: { id } });

    if (!announcement) {
        return NextResponse.json({ message: 'Anuncio no encontrado' }, { status: 404 });
    }
    
    if (session.role === 'INSTRUCTOR' && announcement.authorId !== session.id) {
        return NextResponse.json({ message: 'No tienes permiso para editar este anuncio.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, audience } = body;

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: { title, content, audience },
    });

    return NextResponse.json(updatedAnnouncement);
  } catch (error) {
    console.error('[ANNOUNCEMENT_PUT_ERROR]', error);
    return NextResponse.json({ message: 'Error al actualizar el anuncio' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = context.params;
    const announcement = await prisma.announcement.findUnique({ where: { id } });

     if (!announcement) {
        return NextResponse.json({ message: 'Anuncio no encontrado' }, { status: 404 });
    }
    
    if (session.role === 'INSTRUCTOR' && announcement.authorId !== session.id) {
        return NextResponse.json({ message: 'No tienes permiso para eliminar este anuncio.' }, { status: 403 });
    }

    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ message: 'Anuncio eliminado correctamente' });
  } catch (error) {
    console.error('[ANNOUNCEMENT_DELETE_ERROR]', error);
    return NextResponse.json({ message: 'Error al eliminar el anuncio' }, { status: 500 });
  }
}
