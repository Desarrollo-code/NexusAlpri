import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function checkAuth(req: NextRequest, resourceId: string) {
    const session = await getCurrentUser();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return { authorized: false, error: NextResponse.json({ message: 'No autorizado' }, { status: 403 }) };
    }

    if (session.role === 'INSTRUCTOR') {
        const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
        if (resource?.uploaderId !== session.id) {
             return { authorized: false, error: NextResponse.json({ message: 'No tienes permiso para modificar este recurso' }, { status: 403 }) };
        }
    }
    return { authorized: true, error: null };
}

// Set a PIN
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = await params;
    const authResult = await checkAuth(req, id);
    if (!authResult.authorized) return authResult.error;
    
    try {
        const { pin } = await req.json();
        if (!pin || pin.length < 4) {
            return NextResponse.json({ message: 'El PIN debe tener al menos 4 caracteres' }, { status: 400 });
        }
        
        const hashedPin = await bcrypt.hash(pin, 10);
        
        await prisma.resource.update({
            where: { id },
            data: { pin: hashedPin },
        });

        return NextResponse.json({ message: 'PIN establecido correctamente' });

    } catch (error) {
        console.error('[RESOURCE_PIN_POST_ERROR]', error);
        return NextResponse.json({ message: 'Error al establecer el PIN' }, { status: 500 });
    }
}

// Remove a PIN
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = await params;
    const authResult = await checkAuth(req, id);
    if (!authResult.authorized) return authResult.error;

    try {
        await prisma.resource.update({
            where: { id },
            data: { pin: null },
        });
        return NextResponse.json({ message: 'PIN eliminado correctamente' });
    } catch (error) {
        console.error('[RESOURCE_PIN_DELETE_ERROR]', error);
        return NextResponse.json({ message: 'Error al eliminar el PIN' }, { status: 500 });
    }
}
