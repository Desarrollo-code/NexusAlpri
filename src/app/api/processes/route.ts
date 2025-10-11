// src/app/api/processes/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function buildHierarchy(processes: any[], parentId: string | null = null): any[] {
  return processes
    .filter(p => p.parentId === parentId)
    .map(p => ({
      ...p,
      children: buildHierarchy(processes, p.id),
    }));
}

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'ADMINISTRATOR') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const allProcesses = await prisma.process.findMany({
      include: {
        users: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const hierarchicalProcesses = buildHierarchy(allProcesses);

    return NextResponse.json(hierarchicalProcesses);
  } catch (error) {
    console.error('[PROCESSES_GET_ERROR]', error);
    return NextResponse.json({ message: 'Error al obtener los procesos' }, { status: 500 });
  }
}

// POST (create) a new process
export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'ADMINISTRATOR') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const { name, parentId } = await req.json();
    if (!name) {
      return NextResponse.json({ message: 'El nombre es requerido' }, { status: 400 });
    }

    const newProcess = await prisma.process.create({
      data: {
        name,
        parentId: parentId || null,
      },
    });

    return NextResponse.json(newProcess, { status: 201 });
  } catch (error) {
    console.error('[PROCESS_POST_ERROR]', error);
    if ((error as any).code === 'P2002') {
        return NextResponse.json({ message: 'Ya existe un proceso con este nombre.'}, { status: 409 });
    }
    return NextResponse.json({ message: 'Error al crear el proceso' }, { status: 500 });
  }
}
