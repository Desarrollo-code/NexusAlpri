// src/app/api/users/[id]/theme/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, context: { params: { id: string } }) {
    const session = await getCurrentUser();
    const { id } = context.params;

    if (!session || session.id !== id) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { theme } = await req.json();
        
        if (!theme || typeof theme !== 'string') {
            return NextResponse.json({ message: 'El tema es requerido y debe ser un string.' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id },
            data: { theme },
        });

        return NextResponse.json({ success: true, message: 'Tema actualizado correctamente.' });

    } catch (error) {
        console.error('[USER_THEME_UPDATE_ERROR]', error);
        return NextResponse.json({ message: 'Error interno del servidor al actualizar el tema' }, { status: 500 });
    }
}
