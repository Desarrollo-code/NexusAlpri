import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const { pin } = await req.json();
        if (!pin) {
            return NextResponse.json({ message: 'PIN es requerido' }, { status: 400 });
        }

        const resource = await prisma.resource.findUnique({
            where: { id: id },
            select: { pin: true, url: true }
        });

        if (!resource || !resource.pin) {
            return NextResponse.json({ message: 'Recurso no encontrado o no está protegido' }, { status: 404 });
        }

        const isPinValid = await bcrypt.compare(pin, resource.pin);

        if (!isPinValid) {
            return NextResponse.json({ message: 'PIN incorrecto' }, { status: 403 });
        }

        return NextResponse.json({ message: 'PIN verificado', url: resource.url });

    } catch (error) {
        console.error('[RESOURCE_PIN_VERIFY_ERROR]', error);
        return NextResponse.json({ message: 'Error al verificar el PIN' }, { status: 500 });
    }
}
