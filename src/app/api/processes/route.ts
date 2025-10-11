// src/app/api/processes/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'ADMINISTRATOR') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const processes = await prisma.process.findMany({
      include: {
        children: {
          include: {
            children: true, // Incluir hasta 3 niveles
          },
          orderBy: { name: 'asc' },
        },
        users: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      where: {
        parentId: null, // Solo traer los procesos de nivel superior
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(processes);
  } catch (error) {
    console.error('[PROCESSES_GET_ERROR]', error);
    return NextResponse.json({ message: 'Error al obtener los procesos' }, { status: 500 });
  }
}
