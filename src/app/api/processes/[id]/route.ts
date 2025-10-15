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
    const { name, parentId, userIds } = await req.json(); // Se añade userIds
    if (!name) {
      return NextResponse.json({ message: 'El nombre es requerido' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
        // 1. Actualizar el proceso
        const updatedProcess = await tx.process.update({
            where: { id },
            data: {
                name,
                parentId: parentId || null,
            },
        });

        // 2. Si se envían userIds, asignarlos a este proceso.
        // Primero, desasignamos a los usuarios que estaban en este proceso pero ya no lo están en la nueva lista.
        // (Opcional, pero buena práctica si se quiere que la asignación sea exclusiva)
        // Por simplicidad, aquí solo asignaremos los nuevos.
        if (userIds && Array.isArray(userIds)) {
            await tx.user.updateMany({
                where: { id: { in: userIds } },
                data: {
                    processId: id,
                },
            });
             // Opcional: Desasignar a los que ya no están
            const currentUsersInProcess = await tx.user.findMany({
                where: { processId: id, NOT: { id: { in: userIds }}},
                select: { id: true }
            });
            const usersToRemove = currentUsersInProcess.map(u => u.id);
            if (usersToRemove.length > 0) {
                 await tx.user.updateMany({
                    where: { id: { in: usersToRemove } },
                    data: { processId: null }
                });
            }
        }
        return updatedProcess;
    });


    const finalProcess = await prisma.process.findUnique({
        where: { id },
        include: { users: true }
    });

    return NextResponse.json(finalProcess);
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
    // Before deleting, update children to have null parentId
    await prisma.process.updateMany({
        where: { parentId: id },
        data: { parentId: null }
    });
    
    // Now delete the process
    await prisma.process.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`[PROCESS_DELETE_ERROR: ${id}]`, error);
    return NextResponse.json({ message: 'Error al eliminar el proceso' }, { status: 500 });
  }
}
