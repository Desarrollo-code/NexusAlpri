// src/app/api/resources/[id]/pin/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkResourceOwnership } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    const { id: resourceId } = params;

    const hasPermission = await checkResourceOwnership(session, resourceId);
    if (!hasPermission) {
        return NextResponse.json({ message: 'No tienes permiso para modificar este recurso' }, { status: 403 });
    }

    try {
        const { isPinned } = await req.json();

        if (typeof isPinned !== 'boolean') {
            return NextResponse.json({ message: 'El campo "isPinned" es requerido y debe ser booleano.' }, { status: 400 });
        }

        const updatedResource = await prisma.enterpriseResource.update({
            where: { id: resourceId },
            data: { isPinned },
        });

        return NextResponse.json(updatedResource);

    } catch (error) {
        console.error(`[RESOURCE_PIN_PATCH_ERROR: ${resourceId}]`, error);
        return NextResponse.json({ message: 'Error al actualizar el estado de fijado' }, { status: 500 });
    }
}
