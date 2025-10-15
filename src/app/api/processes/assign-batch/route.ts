// src/app/api/processes/assign-batch/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'ADMINISTRATOR') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const { processId, userIds } = await req.json();

    if (!processId || !Array.isArray(userIds)) {
      return NextResponse.json({ message: 'Se requiere processId y un array de userIds.' }, { status: 400 });
    }

    // Usamos una transacción para asegurar la atomicidad de la operación
    const result = await prisma.$transaction(async (tx) => {
      // Primero, desasignamos a estos usuarios de cualquier otro proceso al que pertenezcan.
      // Un usuario solo puede pertenecer a un proceso.
      await tx.user.updateMany({
        where: {
          id: { in: userIds },
        },
        data: {
          processId: null,
        },
      });

      // Luego, los asignamos al nuevo proceso
      return tx.user.updateMany({
        where: {
          id: { in: userIds },
        },
        data: {
          processId: processId,
        },
      });
    });
    
    return NextResponse.json({ message: `${result.count} usuario(s) asignado(s) correctamente.` });

  } catch (error) {
    console.error(`[PROCESS_ASSIGN_BATCH_ERROR]`, error);
    return NextResponse.json({ message: 'Error al asignar usuarios al proceso' }, { status: 500 });
  }
}
