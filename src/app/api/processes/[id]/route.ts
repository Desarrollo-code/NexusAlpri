// src/app/api/processes/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT (update) a process
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'ADMINISTRATOR') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const { id } = params;
  try {
    const { name, parentId } = await req.json(); 
    if (!name) {
      return NextResponse.json({ message: 'El nombre es requerido' }, { status: 400 });
    }
    
    const updatedProcess = await prisma.process.update({
        where: { id },
        data: {
            name,
            parentId: parentId || null,
        },
    });

    return NextResponse.json(updatedProcess);
  } catch (error) {
    console.error(`[PROCESS_PUT_ERROR: ${id}]`, error);
    return NextResponse.json({ message: 'Error al actualizar el proceso' }, { status: 500 });
  }
}

// DELETE a process
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'ADMINISTRATOR') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const { id } = params;
  try {
    await prisma.$transaction([
        prisma.process.updateMany({
            where: { parentId: id },
            data: { parentId: null }
        }),
        prisma.user.updateMany({
            where: { processes: { some: { id } } },
            data: { processId: null }
        }),
        prisma.process.delete({
            where: { id },
        })
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`[PROCESS_DELETE_ERROR: ${id}]`, error);
    return NextResponse.json({ message: 'Error al eliminar el proceso' }, { status: 500 });
  }
}
