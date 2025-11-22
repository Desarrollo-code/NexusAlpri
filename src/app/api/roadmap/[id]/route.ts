// src/app/api/roadmap/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function checkPermissions(session: any) {
    if (!session || session.role !== 'ADMINISTRATOR') {
        return { authorized: false, error: NextResponse.json({ message: 'No autorizado' }, { status: 403 }) };
    }
    return { authorized: true, error: null };
}

// PUT (Update) a specific roadmap item
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    const permission = await checkPermissions(session);
    // CORRECCIÓN: La condición '!permission.error' era incorrecta y causaba el fallo.
    // La comprobación correcta es simplemente si no está autorizado.
    if (!permission.authorized) {
        return permission.error || NextResponse.json({ message: 'Error de permisos desconocido' }, { status: 500 });
    }

    const { id } = params;

    try {
        const body = await req.json();
        const { title, description, date, phase, icon, color } = body;

        if (!title || !description || !date || !phase) {
            return NextResponse.json({ message: 'Faltan campos requeridos.' }, { status: 400 });
        }

        const updatedItem = await prisma.roadmapItem.update({
            where: { id },
            data: {
                title,
                description,
                date: new Date(date),
                phase,
                icon,
                color,
            },
        });

        return NextResponse.json(updatedItem);

    } catch (error) {
        console.error(`[ROADMAP_PUT_ERROR: ${id}]`, error);
        return NextResponse.json({ message: 'Error al actualizar el hito' }, { status: 500 });
    }
}


// DELETE a specific roadmap item
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getCurrentUser();
    const permission = await checkPermissions(session);
    if (!permission.authorized) {
        return permission.error || NextResponse.json({ message: 'Error de permisos desconocido' }, { status: 500 });
    }
    
    const { id } = params;

    try {
        await prisma.roadmapItem.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });

    } catch (error) {
        if ((error as any).code === 'P2025') { // Prisma error for record not found
             return new NextResponse(null, { status: 204 }); // Already deleted, success.
        }
        console.error(`[ROADMAP_DELETE_ERROR: ${id}]`, error);
        return NextResponse.json({ message: 'Error al eliminar el hito' }, { status: 500 });
    }
}
