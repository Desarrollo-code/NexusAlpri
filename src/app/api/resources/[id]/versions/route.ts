// src/app/api/resources/[id]/versions/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkResourceOwnership } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    const { id: resourceId } = params;

    const hasPermission = await checkResourceOwnership(session, resourceId);
    if (!hasPermission) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const versions = await prisma.resourceVersion.findMany({
            where: { resourceId },
            orderBy: { version: 'desc' },
            include: {
                author: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });

        return NextResponse.json(versions);

    } catch (error) {
        console.error(`[RESOURCE_VERSIONS_GET_ERROR: ${resourceId}]`, error);
        return NextResponse.json({ message: 'Error al obtener el historial de versiones' }, { status: 500 });
    }
}
