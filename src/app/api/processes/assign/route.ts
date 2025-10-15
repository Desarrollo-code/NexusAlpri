// src/app/api/processes/assign/route.ts
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
    
    // Si no hay usuarios para asignar, simplemente retornamos éxito.
    if (userIds.length === 0) {
       return NextResponse.json({ message: 'No se seleccionaron usuarios para asignar.' });
    }
    
    // Usamos una transacción para asegurar la atomicidad de la operación
    const result = await prisma.$transaction(async (tx) => {
      // Primero, desasignamos a CUALQUIER usuario de ESTE proceso que NO esté en la nueva lista de userIds.
      // Esto maneja el caso de "quitar" a un usuario del proceso.
      const currentAssignments = await tx.process.findUnique({
          where: { id: processId },
          select: { users: { select: { id: true } } }
      });
      
      const usersToDisconnect = currentAssignments?.users
          .filter(user => !userIds.includes(user.id))
          .map(user => ({ id: user.id }));

      if (usersToDisconnect && usersToDisconnect.length > 0) {
          await tx.process.update({
              where: { id: processId },
              data: {
                  users: {
                      disconnect: usersToDisconnect
                  }
              }
          });
      }
      
      // Luego, asignamos los usuarios de la lista. Prisma maneja inteligentemente
      // las conexiones, por lo que `connect` no fallará si un usuario ya está conectado.
      // También se encargará de mover a un usuario si estaba en otro proceso.
      await tx.user.updateMany({
        where: { id: { in: userIds } },
        data: { processId: processId },
      });
      
      return { count: userIds.length };
    });
    
    return NextResponse.json({ message: `Se asignaron ${result.count} usuarios correctamente.` });

  } catch (error) {
    console.error(`[PROCESS_ASSIGN_ERROR]`, error);
    return NextResponse.json({ message: 'Error al asignar usuarios al proceso' }, { status: 500 });
  }
}