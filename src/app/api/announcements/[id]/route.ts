
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = params;
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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id } = params;
    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ message: 'Anuncio eliminado correctamente' });
  } catch (error) {
    console.error('[ANNOUNCEMENT_DELETE_ERROR]', error);
    return NextResponse.json({ message: 'Error al eliminar el anuncio' }, { status: 500 });
  }
}
