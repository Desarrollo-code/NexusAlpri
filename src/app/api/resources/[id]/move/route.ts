
// src/app/api/resources/[id]/move/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { id: resourceId } = params;
    const { parentId } = await req.json();

    try {
        const resourceToMove = await prisma.enterpriseResource.findUnique({
            where: { id: resourceId },
        });

        if (!resourceToMove) {
            return NextResponse.json({ message: 'Recurso no encontrado' }, { status: 404 });
        }
        
        // Un instructor solo puede mover los recursos que ha subido
        if (session.role === 'INSTRUCTOR' && resourceToMove.uploaderId !== session.id) {
            return NextResponse.json({ message: 'No tienes permiso para mover este recurso' }, { status: 403 });
        }
        
        // Verificar que el destino es una carpeta
        if (parentId) {
            const targetFolder = await prisma.enterpriseResource.findUnique({
                where: { id: parentId }
            });
            if (!targetFolder || targetFolder.type !== 'FOLDER') {
                 return NextResponse.json({ message: 'El destino debe ser una carpeta válida.' }, { status: 400 });
            }
        }

        const updatedResource = await prisma.enterpriseResource.update({
            where: { id: resourceId },
            data: { parentId: parentId },
        });

        return NextResponse.json(updatedResource);

    } catch (error) {
        console.error('[RESOURCE_MOVE_ERROR]', error);
        return NextResponse.json({ message: 'Error al mover el recurso' }, { status: 500 });
    }
}
