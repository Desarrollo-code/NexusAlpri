
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET a specific resource
export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const resource = await prisma.resource.findUnique({
            where: { id: params.id },
            include: {
                uploader: { select: { id: true, name: true } },
            },
        });
        if (!resource) {
            return NextResponse.json({ message: 'Recurso no encontrado' }, { status: 404 });
        }
        return NextResponse.json(resource);
    } catch (error) {
        console.error('[RESOURCE_GET_ERROR]', error);
        return NextResponse.json({ message: 'Error al obtener el recurso' }, { status: 500 });
    }
}


// PUT (update) a resource
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }
    
    try {
        const resourceToUpdate = await prisma.resource.findUnique({ where: { id: params.id } });
        if (!resourceToUpdate) {
            return NextResponse.json({ message: 'Recurso no encontrado' }, { status: 404 });
        }
        if (session.role === 'INSTRUCTOR' && resourceToUpdate.uploaderId !== session.id) {
             return NextResponse.json({ message: 'No tienes permiso para editar este recurso' }, { status: 403 });
        }

        const { title, category, tags } = await req.json();

        const updatedResource = await prisma.resource.update({
            where: { id: params.id },
            data: { title, category, tags },
        });

        return NextResponse.json(updatedResource);
    } catch (error) {
        console.error('[RESOURCE_PUT_ERROR]', error);
        return NextResponse.json({ message: 'Error al actualizar el recurso' }, { status: 500 });
    }
}

// DELETE a resource
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
     const session = await getSession();
    if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const resourceToDelete = await prisma.resource.findUnique({ where: { id: params.id } });
        if (!resourceToDelete) {
            return NextResponse.json({ message: 'Recurso no encontrado' }, { status: 404 });
        }
        if (session.role === 'INSTRUCTOR' && resourceToDelete.uploaderId !== session.id) {
             return NextResponse.json({ message: 'No tienes permiso para eliminar este recurso' }, { status: 403 });
        }
        
        if (resourceToDelete.type === 'FOLDER') {
            // Recursive delete for folders might be needed here, or prevent deletion if not empty
            const children = await prisma.resource.count({ where: { parentId: params.id } });
            if (children > 0) {
                return NextResponse.json({ message: 'No se puede eliminar una carpeta que no está vacía' }, { status: 400 });
            }
        }

        await prisma.resource.delete({ where: { id: params.id } });
        // Note: Actual file deletion from storage is not handled here.

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[RESOURCE_DELETE_ERROR]', error);
        return NextResponse.json({ message: 'Error al eliminar el recurso' }, { status: 500 });
    }
}
