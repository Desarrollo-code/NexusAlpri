// src/app/api/events/participations/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { isVerified } = await req.json();
        const participationId = params.id;

        const updated = await prisma.eventParticipation.update({
            where: { id: participationId },
            data: { isVerified }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('[PARTICIPATION_PATCH_ERROR]', error);
        return NextResponse.json({ message: 'Error al actualizar la participación' }, { status: 500 });
    }
}
