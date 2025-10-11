// src/app/api/motivations/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function checkPermissions(session: any, messageId: string) {
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return { authorized: false, error: NextResponse.json({ message: 'No autorizado' }, { status: 403 }) };
    }

    const message = await prisma.motivationalMessage.findUnique({
        where: { id: messageId },
        select: { creatorId: true }
    });

    if (!message) {
        return { authorized: false, error: NextResponse.json({ message: 'Mensaje no encontrado' }, { status: 404 }) };
    }

    if (session.role === 'INSTRUCTOR' && message.creatorId !== session.id) {
        return { authorized: false, error: NextResponse.json({ message: 'No tienes permiso para modificar este mensaje' }, { status: 403 }) };
    }
    
    return { authorized: true, error: null };
}

// PUT (Update) a specific motivational message
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    const { id: messageId } = params;
    
    const permission = await checkPermissions(session, messageId);
    if (!permission.authorized) return permission.error;

    try {
        const body = await req.json();
        const { title, content, imageUrl, videoUrl, triggerType, triggerId } = body;
        
        if (!title || !triggerType || !triggerId) {
            return NextResponse.json({ message: 'Título y disparador son requeridos' }, { status: 400 });
        }
        
        const updatedMessage = await prisma.motivationalMessage.update({
            where: { id: messageId },
            data: {
                title,
                content: content || null,
                imageUrl: imageUrl || null,
                videoUrl: videoUrl || null,
                triggerType,
                triggerId,
            },
        });

        return NextResponse.json(updatedMessage);
    } catch (error) {
        console.error(`[MOTIVATION_PUT_ERROR: ${messageId}]`, error);
        return NextResponse.json({ message: 'Error al actualizar el mensaje' }, { status: 500 });
    }
}


// DELETE a specific motivational message
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    const { id: messageId } = params;

    const permission = await checkPermissions(session, messageId);
    if (!permission.authorized) return permission.error;
    
    try {
        await prisma.motivationalMessage.delete({
            where: { id: messageId },
        });

        return new NextResponse(null, { status: 204 });

    } catch (error) {
        if ((error as any).code === 'P2025') {
             return NextResponse.json({ message: 'El mensaje ya había sido eliminado.' }, { status: 404 });
        }
        console.error(`[MOTIVATION_DELETE_ERROR: ${messageId}]`, error);
        return NextResponse.json({ message: 'Error al eliminar el mensaje' }, { status: 500 });
    }
}
