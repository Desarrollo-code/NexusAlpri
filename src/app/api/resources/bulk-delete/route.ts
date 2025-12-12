// src/app/api/resources/bulk-delete/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { ids } = await req.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ message: 'Se requiere un array de IDs.' }, { status: 400 });
        }

        // Check permissions for all resources to be deleted if the user is an instructor
        if (session.role === 'INSTRUCTOR') {
            const resources = await prisma.enterpriseResource.findMany({
                where: { id: { in: ids } },
                select: { uploaderId: true }
            });
            const hasPermission = resources.every(r => r.uploaderId === session.id);
            if (!hasPermission) {
                return NextResponse.json({ message: 'No tienes permiso para eliminar uno o más de los recursos seleccionados.' }, { status: 403 });
            }
        }

        // Proceed with deletion in a transaction
        const deleteResult = await prisma.$transaction([
            prisma.notification.deleteMany({
                where: { link: { in: ids.map(id => `/resources?id=${id}`) } }
            }),
            prisma.enterpriseResource.deleteMany({
                where: { id: { in: ids } },
            })
        ]);

        return NextResponse.json({ message: `${deleteResult[1].count} elementos eliminados.` }, { status: 200 });
    } catch (error) {
        console.error('[RESOURCE_BULK_DELETE_ERROR]', error);
        return NextResponse.json({ message: 'Error al realizar la eliminación en lote.' }, { status: 500 });
    }
}
