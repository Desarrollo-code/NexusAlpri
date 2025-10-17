// src/app/api/processes/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { Process } from '@/types';

export const dynamic = 'force-dynamic';

interface ProcessWithChildren extends Process {
  children: ProcessWithChildren[];
}

interface FlatProcess {
    id: string;
    name: string;
    level: number;
}


// Función para aplanar la jerarquía
function flattenHierarchy(processes: ProcessWithChildren[], level = 0): FlatProcess[] {
  const flatList: FlatProcess[] = [];
  for (const process of processes) {
    flatList.push({ id: process.id, name: process.name, level });
    if (process.children.length > 0) {
      flatList.push(...flattenHierarchy(process.children, level + 1));
    }
  }
  return flatList;
}

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
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');

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

    if (format === 'flat') {
        const flatList = flattenHierarchy(hierarchicalProcesses);
        return NextResponse.json(flatList);
    }

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
        const { name, parentId, userIds } = await req.json();
        if (!name) {
            return NextResponse.json({ message: 'El nombre es requerido' }, { status: 400 });
        }

        const newProcess = await prisma.process.create({
            data: {
                name,
                parentId: parentId || null,
            },
        });
        
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            await prisma.user.updateMany({
                where: { id: { in: userIds }, processId: { not: null } },
                data: { processId: null }
            });

            await prisma.user.updateMany({
                where: { id: { in: userIds } },
                data: { processId: newProcess.id },
            });
        }
        
        return NextResponse.json(newProcess, { status: 201 });

    } catch (error) {
        console.error('[PROCESS_POST_ERROR]', error);
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ message: 'Ya existe un proceso con este nombre.'}, { status: 409 });
        }
        return NextResponse.json({ message: 'Error al crear el proceso' }, { status: 500 });
    }
}
