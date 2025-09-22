// src/app/api/announcements/[id]/read/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Endpoint para marcar un anuncio como leído
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { id: announcementId } = params;

    try {
        // Usamos upsert para evitar errores si el registro ya existe (por ejemplo, por múltiples llamadas)
        await prisma.announcementRead.upsert({
            where: {
                userId_announcementId: {
                    userId: session.id,
                    announcementId,
                }
            },
            update: {},
            create: {
                userId: session.id,
                announcementId,
            }
        });

        return new NextResponse(null, { status: 204 }); // No content, éxito

    } catch (error) {
        console.error('[ANNOUNCEMENT_READ_ERROR]', error);
        return NextResponse.json({ message: 'Error al marcar el anuncio como leído' }, { status: 500 });
    }
}
