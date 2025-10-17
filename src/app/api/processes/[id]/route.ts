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
    const { name, parentId, userIds } = await req.json();
    if (!name) {
      return NextResponse.json({ message: 'El nombre es requerido' }, { status: 400 });
    }

    const [updatedProcess] = await prisma.$transaction(async (tx) => {
      const processUpdate = tx.process.update({
          where: { id },
          data: {
              name,
              parentId: parentId || null,
          },
      });

      if (userIds && Array.isArray(userIds)) {
          // Primero, desasigna a los usuarios que ya no pertenecen a este proceso
          await tx.user.updateMany({
              where: {
                  processId: id,
                  id: { notIn: userIds },
              },
              data: {
                  processId: null,
              },
          });
          
          // Luego, asigna los nuevos usuarios al proceso
          await tx.user.updateMany({
              where: { id: { in: userIds } },
              data: { processId: id },
          });
      }

      return Promise.all([processUpdate]);
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
        // Des-asigna los hijos para que no sean eliminados
        prisma.process.updateMany({
            where: { parentId: id },
            data: { parentId: null }
        }),
        // Des-asigna los usuarios
        prisma.user.updateMany({
            where: { processId: id },
            data: { processId: null }
        }),
        // Finalmente, elimina el proceso
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
